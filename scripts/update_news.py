"""Collect official publications at deploy time; never invent dates or replace good data on failure."""
import json
import re
import urllib.request
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin, urlsplit

SOURCES = {
    'cz': ('Честный ЗНАК', 'https://crpt.ru/news/'),
    'teksher': ('Текшер KG', 'https://main.teksher.kg/news.html'),
}
OUTPUT = Path(__file__).resolve().parents[1] / 'public/news.json'

class Publications(HTMLParser):
    def __init__(self, source, base):
        super().__init__(convert_charrefs=True)
        self.source, self.base = source, base
        self.items, self.current, self.capture = [], None, None
        self.pending_date, self.date_text, self.reading_date = None, "", False

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if self.source == 'teksher' and tag == 'article' and 'c-post-item' in attrs.get('class', '').split() and attrs.get('id'):
            self.current = {'source': self.source, 'link': self.base + '#' + attrs['id'], 'title': '', 'desc': '', 'date': None}
        if self.source == 'cz' and tag == 'div' and 'news-card' in attrs.get('class', '').split():
            self.pending_date = None
        if self.source == 'cz' and tag == 'div' and 'news-card__date' in attrs.get('class', '').split():
            self.date_text, self.reading_date = '', True
        if self.source == 'cz' and tag == 'a' and 'news-card__title' in attrs.get('class', '').split():
            link = urljoin(self.base, attrs.get('href', ''))
            if urlsplit(link).hostname == urlsplit(self.base).hostname and re.fullmatch(r'/news/\d+/\d+/', urlsplit(link).path):
                self.current = {'source': self.source, 'link': link, 'title': '', 'desc': '', 'date': self.pending_date}
                self.capture = 'title'
        if self.current:
            if self.source == 'teksher' and tag == 'h4': self.capture = 'title'
            if self.source == 'teksher' and tag == 'p' and not self.current['desc']: self.capture = 'desc'
            if tag == 'time' and attrs.get('datetime'):
                try: self.current['date'] = datetime.fromisoformat(attrs['datetime'].replace('Z', '+00:00')).isoformat()
                except ValueError: pass

    def handle_data(self, text):
        if self.reading_date: self.date_text += text
        if self.current and self.capture: self.current[self.capture] += text + ' '

    def handle_endtag(self, tag):
        if self.reading_date and tag == 'div':
            try: self.pending_date = datetime.strptime(self.date_text.strip(), '%d.%m.%Y').date().isoformat()
            except ValueError: self.pending_date = None
            self.reading_date = False
        if self.source == 'teksher' and tag in ('h4', 'p'): self.capture = None
        if (self.source == 'teksher' and tag == 'article') or (self.source == 'cz' and tag == 'a'):
            if self.current:
                item = self.current
                item['title'] = re.sub(r'\s+', ' ', item['title']).strip()
                item['desc'] = re.sub(r'\s+', ' ', item['desc']).strip()[:220]
                if len(item['title']) > 5 and not any(i['link'] == item['link'] for i in self.items): self.items.append(item)
            self.current, self.capture = None, None


def collect(source, url):
    request = urllib.request.Request(url, headers={'User-Agent': 'KrasMatrix-News/1.0 (+https://krasmatrix.com/)'})
    with urllib.request.urlopen(request, timeout=25) as response:
        if 'html' not in response.headers.get('Content-Type', ''): raise ValueError('Unexpected content type')
        html = response.read(4_000_001)
        if len(html) > 4_000_000: raise ValueError('Response too large')
        parser = Publications(source, url)
        parser.feed(html.decode(response.headers.get_content_charset() or 'utf-8'))
    if not parser.items: raise ValueError('No publications found; source layout may have changed')
    return parser.items[:12]


def main():
    now = datetime.now(timezone.utc).isoformat()
    try: previous = json.loads(OUTPUT.read_text())
    except (FileNotFoundError, ValueError): previous = {'items': [], 'sources': {}}
    result = {'checkedAt': now, 'items': [], 'sources': {}}
    for source, (label, url) in SOURCES.items():
        old = previous.get('sources', {}).get(source, {})
        try:
            items = collect(source, url)
            status = {'label': label, 'url': url, 'status': 'ok', 'updatedAt': now}
            print(f'{source}: {len(items)} publications')
        except Exception as error:
            items = [i for i in previous.get('items', []) if i.get('source') == source]
            status = {'label': label, 'url': url, 'status': 'error', 'updatedAt': old.get('updatedAt')}
            print(f'{source}: unavailable ({type(error).__name__}); retained {len(items)} publications')
        result['items'].extend(items)
        result['sources'][source] = status
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    temporary = OUTPUT.with_suffix('.tmp')
    temporary.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
    temporary.replace(OUTPUT)

if __name__ == '__main__': main()
