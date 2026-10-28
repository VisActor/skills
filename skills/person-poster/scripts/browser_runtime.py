"""Shared browser mode and observable, bounded page loading for poster tools."""
from __future__ import annotations

import json
import sys
from time import monotonic


def browser_launch_options() -> dict:
    # Full Chromium's supported headless mode avoids a separate shell on macOS.
    return {'headless': True, 'timeout': 30000, **({'channel': 'chromium'} if sys.platform == 'darwin' else {})}


class PageDiagnostics:
    def __init__(self, page, timeout_ms=30000):
        self.page = page
        self.events = []
        self.stage = 'created'
        page.set_default_timeout(timeout_ms)
        page.set_default_navigation_timeout(timeout_ms)
        page.add_init_script("""(() => {
          window.__POSTER_PAGE_ERRORS__ = [];
          addEventListener('error', e => {
            if (e.message) window.__POSTER_PAGE_ERRORS__.push({message:e.message,
              url:e.filename,line:e.lineno,column:e.colno,name:e.error?.name || 'Error'});
          });
          addEventListener('unhandledrejection', e => window.__POSTER_PAGE_ERRORS__.push({
            message:String(e.reason),name:'UnhandledRejection'}));
        })()""")
        page.on('pageerror', lambda error: self.add('pageerror', str(error), stack=getattr(error, 'stack', '')))
        page.on('requestfailed', lambda request: self.add('requestfailed', request.failure, url=request.url))
        page.on('response', lambda response: self.add('http', str(response.status), url=response.url)
                if response.status >= 400 else None)
        page.on('console', lambda message: self.add('console', message.text, location=message.location)
                if message.type == 'error' else None)

    def add(self, kind, message, **details):
        if len(self.events) < 50:
            self.events.append({'kind': kind, 'message': str(message)[:4096], **details})

    def report(self):
        return {'stage': self.stage, 'url': self.page.url, 'events': self.events}

    def check(self):
        for event in self.page.evaluate("window.__POSTER_PAGE_ERRORS__ || []"):
            record = {'kind': 'pageerror', **event}
            if record not in self.events and len(self.events) < 50:
                self.events.append(record)
        fatal = [e for e in self.events if e['kind'] in ('pageerror', 'requestfailed', 'http')]
        marker = self.page.evaluate("window.__INFOGRAPHIC_ERROR__ || ''")
        if fatal or marker:
            raise RuntimeError('Page execution failed: ' + json.dumps(
                {**self.report(), 'marker': marker}, ensure_ascii=False))


def load_page(page, url, *, ready_expression='', timeout_ms=30000, wait_until='load'):
    diagnostics = PageDiagnostics(page, timeout_ms)
    try:
        diagnostics.stage = 'navigation'
        page.goto(url, wait_until=wait_until, timeout=timeout_ms)
        diagnostics.stage = 'readiness'
        deadline = monotonic() + timeout_ms / 1000
        while True:
            diagnostics.check()
            if not ready_expression or page.evaluate(f'Boolean({ready_expression})'):
                diagnostics.stage = 'ready'
                return diagnostics
            if monotonic() >= deadline:
                raise TimeoutError('Readiness marker did not become true')
            page.wait_for_timeout(100)
    except Exception as error:
        raise RuntimeError(f'{error}; pageDiagnostics=' + json.dumps(diagnostics.report(), ensure_ascii=False)) from error
