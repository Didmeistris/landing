import importlib.util, json, tempfile, unittest
from pathlib import Path
from unittest.mock import patch
spec=importlib.util.spec_from_file_location('news',Path(__file__).resolve().parents[1]/'scripts/update_news.py')
news=importlib.util.module_from_spec(spec);spec.loader.exec_module(news)
class Tests(unittest.TestCase):
 def test_teksher(self):
  p=news.Publications('teksher',news.SOURCES['teksher'][1]);p.feed('<!-- <article class="c-post-item" id="fake"><h4>Fake news</h4></article> --><article class="c-post-item" id="real"><h4>Новая группа товаров</h4><p>Требования с 12.06.2026</p></article>')
  self.assertEqual(len(p.items),1);self.assertIsNone(p.items[0]['date']);self.assertTrue(p.items[0]['link'].endswith('#real'))
 def test_cz(self):
  p=news.Publications('cz',news.SOURCES['cz'][1]);p.feed('<div class="news-card__date">25.09.2026</div><a class="news-card__title" href="/news/1/2320/">Реальная новость</a><a class="news-card__title" href="/news/1/2320/">Реальная новость</a><a class="news-card__title" href="https://evil.test/news/1/1/">Bad source</a>')
  self.assertEqual(len(p.items),1);self.assertEqual(p.items[0]['date'],'2026-09-25')
 def test_retention(self):
  with tempfile.TemporaryDirectory() as d:
   output=Path(d)/'news.json';item={'source':'cz','title':'Последняя новость','link':news.SOURCES['cz'][1]+'example/'};output.write_text(json.dumps({'items':[item],'sources':{'cz':{'updatedAt':'2026-09-29T12:00:00+00:00'}}}))
   with patch.object(news,'OUTPUT',output),patch.object(news,'collect',side_effect=RuntimeError):news.main()
   r=json.loads(output.read_text());self.assertEqual(r['items'],[item]);self.assertEqual(r['sources']['cz']['status'],'error');self.assertEqual(r['sources']['cz']['updatedAt'],'2026-09-29T12:00:00+00:00')
if __name__=='__main__':unittest.main()
