import pytest

pytestmark = pytest.mark.poster_browser


def page(parent='', child='', wrapper=''):
    return f'''<!doctype html><style>
      body{{margin:0}} #infographic{{width:1000px;height:800px;position:relative}}
      #clipper{{position:relative;margin:40px;width:100px;height:50px;{parent}}}
      #value{{width:400px;height:40px;font:24px sans-serif;white-space:nowrap;{child}}}
    </style><main id="infographic"><div style="{wrapper}"><div id="clipper">
      <div id="value" data-required="award">Award count: 123456789</div>
    </div></div></main>'''


@pytest.mark.parametrize('parent,child,axis', [
    ('overflow:hidden', '', 'x'),
    ('overflow:clip', '', 'x'),
    ('overflow:auto', '', 'x'),
    ('overflow:scroll', '', 'x'),
    ('overflow:hidden;width:500px;height:20px', '', 'y'),
    ('overflow:hidden;border:10px solid black', '', 'x'),
    ('overflow:hidden;transform:translate(30px,20px) scale(1.5);transform-origin:0 0', '', 'x'),
])
def test_required_content_clipped_by_ancestor(inspect_page, parent, child, axis):
    report = inspect_page(page(parent, child))
    assert not report['passed']
    assert any('clipped by ancestor' in e and 'award' in e and 'clipper' in e and f'axis {axis}' in e
               for e in report['errors']), report


@pytest.mark.parametrize('parent,child,wrapper', [
    ('overflow:visible', '', ''),
    ('overflow:hidden;width:500px;border:12px solid black', '', ''),
    ('overflow:hidden;width:398px', '', ''),  # Within the 3px tolerance.
    ('overflow:hidden;width:500px', '', 'transform:scale(0.8);transform-origin:0 0'),
])
def test_visible_content_is_not_rejected(inspect_page, parent, child, wrapper):
    report = inspect_page(page(parent, child, wrapper))
    assert report['passed'], report['errors']


def test_nested_clipper_and_safe_area_evidence(inspect_page):
    report = inspect_page(page('overflow:visible', '', 'width:100px;height:150px;overflow:hidden'))
    assert any('clipped by ancestor' in e for e in report['errors'])
    assert report['items'][0]['bottomSafePx'] == 64
    footer = inspect_page(page('width:500px').replace('data-required="award"', 'data-required="footer"'))
    assert footer['items'][0]['bottomSafePx'] == 96


def test_complex_clipping_is_disclosed(inspect_page):
    report = inspect_page(page('width:500px;clip-path:inset(0 50% 0 0)'))
    assert any('manual visual review' in warning for warning in report['warnings'])


def test_absolute_content_can_escape_a_non_containing_clipper(inspect_page):
    html = page('position:static;overflow:hidden', 'position:absolute;left:40px;top:40px')
    report = inspect_page(html)
    assert report['passed'], report['errors']
