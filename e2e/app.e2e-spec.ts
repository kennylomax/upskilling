import { UpskillingPathsPage } from './app.po';

describe('upskillingpaths App', () => {
  let page: UpskillingPathsPage;

  beforeEach(() => {
    page = new UpskillingPathsPage();
  });

  it('should display welcome message', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('Welcome to toh!!');
  });
});
