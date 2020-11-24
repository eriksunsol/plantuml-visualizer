import { Constants } from './constants';
import { Finder } from './finder/finder';
import { ImgElementFinder } from './finder/imgElementFinder';
import { DescriptionMutator } from './mutator/descriptionMutator';

const sleep = (msec: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, msec));

const allFinders = [new ImgElementFinder()];
let enabledFinders: Finder[];
let lastUrl: string;
let embedding = false;

main();

function main(): void {
  embedPlantUmlImages().finally();

  if (!Constants.urlRegexesToBeObserved.some((regex) => regex.test(location.href))) {
    return;
  }

  const observer = new MutationObserver(async (mutations) => {
    const addedSomeNodes = mutations.some((mutation) => mutation.addedNodes.length > 0);
    if (addedSomeNodes) {
      await embedPlantUmlImages();
      embedding = false;
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

async function embedPlantUmlImages(): Promise<void[]> {
  if (lastUrl === location.href && embedding) {
    return [];
  }

  embedding = true;
  if (lastUrl !== location.href) {
    lastUrl = location.href;
    enabledFinders = allFinders.filter((f) => f.canFind(location.href));
  } else {
    // Deal with re-rendering multiple times (e.g. it occurs when updating a GitHub issue)
    await sleep(1000);
  }
  return Promise.all([DescriptionMutator.embedPlantUmlImages(enabledFinders, location.href, document.body)]);
}
