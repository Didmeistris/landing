"""Daily CBR rates and conservative pricing. All rounding uses exact decimal arithmetic."""
import json
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from decimal import Decimal, ROUND_CEILING
from pathlib import Path
from zoneinfo import ZoneInfo

OUTPUT = Path(__file__).resolve().parents[1] / 'public/pricing.json'
BASE_PLANS = [(1, 23290), (3, 62990), (6, 111990), (12, 194990)]
MICROS = Decimal(1000000)
LIMIT = Decimal(100)


def rounded_minor(rubles, rate, currency):
    """Prefer clean dollar prices or som prices ending in 99, within +100 RUB."""
    exact = Decimal(rubles) / rate
    candidates = []
    if currency == 'USD':
        # Prefer an integer ending in 9 only when the allowed margin permits it.
        candidates.append(((exact + 1) / 10).to_integral_value(rounding=ROUND_CEILING) * 10 - 1)
        candidates.append(exact.to_integral_value(rounding=ROUND_CEILING))
    elif currency == 'KGS':
        candidates.append(((exact + 1) / 100).to_integral_value(rounding=ROUND_CEILING) * 100 - 1)
        candidates.append((exact / 10).to_integral_value(rounding=ROUND_CEILING) * 10)
        candidates.append(exact.to_integral_value(rounding=ROUND_CEILING))
    candidates.append((exact * 100).to_integral_value(rounding=ROUND_CEILING) / 100)
    for amount in candidates:
        delta = amount * rate - Decimal(rubles)
        if 0 <= delta <= LIMIT:
            return int(amount * 100)
    raise ValueError('Cannot satisfy rounding limit with available precision')


def parse_rates(raw, today):
    root = ET.fromstring(raw)
    valid_from = datetime.strptime(root.attrib['Date'], '%d.%m.%Y').date()
    if valid_from > today or (today - valid_from).days > 10:
        raise ValueError('Rates have an invalid effective date')
    rates = {}
    for node in root.findall('Valute'):
        code = node.findtext('CharCode')
        if code in ('USD', 'KGS'):
            value = Decimal(node.findtext('Value').replace(',', '.'))
            nominal = Decimal(node.findtext('Nominal'))
            rate = value / nominal
            if rate <= 0 or rate > 10000 or rate * MICROS != (rate * MICROS).to_integral_value():
                raise ValueError('Invalid exchange rate')
            rates[code] = rate
    if set(rates) != {'USD', 'KGS'}: raise ValueError('Missing required currencies')
    return valid_from.isoformat(), rates


def build_data(raw, today, checked_at):
    effective, rates = parse_rates(raw, today)
    data = {'checkedAt': checked_at, 'requestedDate': today.isoformat(), 'effectiveDate': effective,
            'status': 'ok', 'source': 'https://www.cbr.ru/currency_base/daily/',
            'rateMicros': {'RUB': 1000000, **{code: int(rate * MICROS) for code, rate in rates.items()}}, 'plans': []}
    for months, rubles in BASE_PLANS:
        amounts = {'RUB': rubles * 100}
        for code, rate in rates.items(): amounts[code] = rounded_minor(rubles, rate, code)
        data['plans'].append({'months': months, 'rubles': rubles, 'amountMinor': amounts})
    return data


def main():
    now = datetime.now(ZoneInfo('Europe/Moscow'))
    today, checked_at = now.date(), now.astimezone(timezone.utc).isoformat()
    url = 'https://www.cbr.ru/scripts/XML_daily.asp?date_req=' + today.strftime('%d/%m/%Y')
    try:
        with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent':'KrasMatrix/1.0'}), timeout=25) as response:
            data = build_data(response.read(1000000), today, checked_at)
        print(f'Pricing: CBR rates effective {data["effectiveDate"]}, checked for {today}')
        for plan in data['plans']: print(plan)
    except Exception as error:
        # Never serve stale foreign prices as today's prices.
        data = {'checkedAt': checked_at, 'requestedDate': today.isoformat(), 'status': 'error',
                'rateMicros': {'RUB': 1000000}, 'plans': [
                    {'months': m, 'rubles': r, 'amountMinor': {'RUB': r * 100}} for m, r in BASE_PLANS]}
        print(f'Pricing: {type(error).__name__}; RUB only until current rates are available')
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    temporary = OUTPUT.with_suffix('.tmp')
    temporary.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
    temporary.replace(OUTPUT)

if __name__ == '__main__': main()
