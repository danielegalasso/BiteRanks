from playwright.sync_api import sync_playwright

class Crawler:

    def __init__(self):
        self.browser = None
        self.page = None
        self.playwright = None

    def launch(self, headless=False):
        self.playwright = sync_playwright().start()
        self.browser = self.playwright.chromium.launch(headless=headless)
        self.page = self.browser.new_page()

    def goto_url(self, url):
        if self.page:
            self.page.goto(url)
        else:
            raise RuntimeError("Page is not initialized. Call `launch()` first.")

    def click(self, param):
        if self.page:
            self.page.click(param)
            self.page.wait_for_load_state('networkidle')
            # self.page.wait_for_timeout(6000)
        else:
            raise RuntimeError("Page is not initialized. Call `launch()` first.")

    def click_all(self, role, name=None):
        if self.page:
            buttons = self.page.get_by_role(role, name=name)
            
            for i in range(buttons.count()):
                buttons.nth(i).click()
            self.page.wait_for_load_state('networkidle')
        else:
            raise RuntimeError("Page is not initialized. Call `launch()` first.")


    def get_page_source(self):
        if self.page:
            return self.page.content()
        else:
            raise RuntimeError("Page is not initialized. Call `launch()` first.")

    def close(self):
        if self.page:
            self.page.close()
        if self.browser:
            self.browser.close()
        if self.playwright:
            self.playwright.stop()
