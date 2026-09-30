import importlib.util,unittest
from pathlib import Path
from datetime import date
from decimal import Decimal
spec=importlib.util.spec_from_file_location('pricing',Path(__file__).resolve().parents[1]/'scripts/update_pricing.py')
pricing=importlib.util.module_from_spec(spec);spec.loader.exec_module(pricing)
XML=b'<ValCurs Date="30.09.2026"><Valute><CharCode>USD</CharCode><Nominal>1</Nominal><Value>84,4283</Value></Valute><Valute><CharCode>KGS</CharCode><Nominal>100</Nominal><Value>96,5465</Value></Valute></ValCurs>'
class Tests(unittest.TestCase):
 def test_nominal_and_effective_day(self):
  effective,rates=pricing.parse_rates(XML,date(2026,9,30));self.assertEqual(effective,'2026-09-30');self.assertEqual(rates['KGS'],Decimal('0.965465'))
  with self.assertRaises(ValueError):pricing.parse_rates(XML,date(2026,9,29))
 def test_all_conversions_stay_above_base_within_100_rubles(self):
  for currency in ['USD','KGS']:
   for rate in map(Decimal,['0.01','0.965465','2.5','50','84.4283','99.9999','101','150','1000','10000']):
    for _,rubles in pricing.BASE_PLANS:
     minor=pricing.rounded_minor(rubles,rate,currency);delta=Decimal(minor)/100*rate-rubles
     self.assertGreaterEqual(delta,0);self.assertLessEqual(delta,100)
 def test_pretty_som_prices_are_conditional_on_margin(self):
  self.assertEqual(pricing.rounded_minor(23290,Decimal('0.965465'),'KGS'),2419900)
  self.assertEqual(pricing.rounded_minor(23290,Decimal('84.4283'),'USD'),27600)
 def test_missing_zero_and_stale_rates_rejected(self):
  for raw in [XML.replace(b'84,4283',b'0'),XML.replace(b'<CharCode>USD</CharCode>',b'<CharCode>EUR</CharCode>')]:
   with self.assertRaises(ValueError):pricing.parse_rates(raw,date(2026,9,30))
  with self.assertRaises(ValueError):pricing.parse_rates(XML,date(2026,10,20))
if __name__=='__main__':unittest.main()
