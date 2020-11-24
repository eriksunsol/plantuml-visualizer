import { Finder, UmlContent } from './finder';

export class ImgElementFinder implements Finder {
  private readonly URL_REGEX = /^https:\/\/github\.com/;
  private readonly IMG_SRC_REGEX = /[^/]+\.(plantuml|puml|pu)$/;
  private readonly INCLUDE_REGEX = /[\r\n\s](!include(sub)?\s+(.*\.(plantuml|puml|pu|iuml|iu))(!(\w+))?)[\r\n\s]/g;
  private readonly STARTSUB_REGEX = /^\s*!startsub\s+(\w+)\s*$/;
  private readonly ENDSUB_REGEX = /^\s*!endsub\s*$/;

  canFind(webPageUrl: string): boolean {
    return this.URL_REGEX.test(webPageUrl);
  }

  async find(webPageUrl: string, $root: HTMLElement): Promise<UmlContent[]> {
    const $imgs = $root.querySelectorAll('img');
    const result = [];
    for (const img of $imgs) {
      const src = img.getAttribute('src') || '';
      if (this.IMG_SRC_REGEX.test(src)) {
        const content = await this.getSrcFileText(src);
        if (content != null) {
          result.push({ $node: img, pumltext: content });
        }
      }
    }
    return result;
  }

  private async getSrcFileText(fileUrl: string): Promise<string | null> {
    const response = await fetch(fileUrl);
    if (!response.ok) return null;
    const text = await response.text();
    return await this.preProcessText(text, fileUrl);
  }

  private async getIncludedFileText(fileUrl: string): Promise<string | null> {
    const response = await fetch(fileUrl);
    if (!response.ok) return null;
    const text = await response.text();
    return await this.preProcessText(text.replace(/@startuml/g, '').replace(/@enduml/g, ''), fileUrl);
  }

  private async preProcessText(text: string, baseUrl: string): Promise<string> {
    const dirUrl = baseUrl.replace(/\/[^/]*\.(plantuml|pu|puml)(\?.*)?$/, '');
    let match: RegExpExecArray | null = null;
    while ((match = this.INCLUDE_REGEX.exec(text))) {
      if (!match[2] && !match[5]) {
        const includedFileText = await this.getIncludedFileText(`${dirUrl}/${match[3]}`);
        if (includedFileText != null) {
          text = text.replace(match[1], includedFileText);
        }
      } else if (match[2] && match[6]) {
        const includedLines: string[] = [];
        const includedFileText = await this.getIncludedFileText(`${dirUrl}/${match[3]}`);
        if (includedFileText != null) {
          const includedTextLines = includedFileText.match(/[^\r\n]+/g) || '';
          let depth = 0;
          let startDepth = -1;
          for (const line of includedTextLines) {
            const subMatch = line.match(this.STARTSUB_REGEX);
            if (subMatch) {
              ++depth;
              if (startDepth == -1 && subMatch[1] == match[6]) {
                startDepth = depth;
              }
            } else if (line.match(this.ENDSUB_REGEX)) {
              --depth;
              if (startDepth > depth) {
                startDepth = -1;
              }
            } else if (startDepth != -1 && depth >= startDepth) {
              includedLines.push(line);
            }
          }
        }
        text = text.replace(match[1], includedLines.join('\n'));
      }
    }
    return text;
  }
}
