import { Finder } from '../finder/finder';

import { markAsAlreadyProcessed, setDblclickHandlers, textToImage } from './mutatorUtil';

export const DescriptionMutator = {
  async embedPlantUmlImages(finders: Finder[], webPageUrl: string, $root: JQuery<Node>): Promise<void> {
    await Promise.all(
      finders.map(async (finder) => {
        const contents = await finder.find(webPageUrl, $root);
        for (const content of contents) {
          // Skip if no PlantUML descriptions exist
          if (!content.pumltext.length) continue;

          const $node = content.$node;

          // To avoid embedding an image multiple times
          let $image: JQuery<Node>;
          if (markAsAlreadyProcessed($node)) {
            $image = await textToImage(content.pumltext);
            $image.insertAfter($node);
          } else {
            $image = $node.next();
          }

          setDblclickHandlers($node, $image);
        }
      })
    );
  },
};
