import { Finder } from '../finder/finder';

import { markAsAlreadyProcessed, textToEncodedImage } from './mutatorUtil';

export const DescriptionMutator = {
  async embedPlantUmlImages(finders: Finder[], webPageUrl: string, $root: HTMLElement): Promise<void> {
    await Promise.all(
      finders.map(async (finder) => {
        const contents = await finder.find(webPageUrl, $root);
        for (const content of contents) {
          // Skip if no PlantUML descriptions exist
          if (!content.pumltext.length) continue;

          const $node = content.$node;

          // To avoid embedding an image multiple times
          if (markAsAlreadyProcessed($node)) {
            const encodedImage = await textToEncodedImage(content.pumltext);
            $node.setAttribute('src', encodedImage);
          }
        }
      })
    );
  },
};
