'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
class MarkdownRender {
    constructor(options) {
        this.options = options || {};
        this.modules = {};
        this.mermaidOptions = {};
        return this;
    }
    renderToHtml(mdContent) {
        this.loadModules();
        const renderer = this.getRenderer();
        const b = renderer.render(mdContent);
        const h = this.mermaidOptions.returnHead || '';
        return {
            body: b,
            head: h,
        };
    }
    getInitOptions(markdownContent) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.options.mermaid) {
                if (typeof markdownContent !== 'string') {
                    throw Error('first argument must be a string');
                }
                const defaultRootWebPath = path.join(__dirname, '..');
                const options = {
                    rootWebPath: defaultRootWebPath,
                };
                const cms = yield this.modules.mermaid.mermaid_pro_plugin_init_everytime(markdownContent);
                return cms;
            }
            return [];
        });
    }
    loadModules() {
        this.modules.MarkdownIt = require('markdown-it');
        if (this.options.taskLists) {
            this.modules.taskLists = require('markdown-it-task-lists');
        }
        if (this.options.lazyHeaders) {
            this.modules.lazyHeaders = require('markdown-it-lazy-headers');
        }
        if (this.options.emoji) {
            this.modules.emoji = require('markdown-it-emoji');
        }
        if (this.options.expandTabs) {
            this.modules.expandTabs = require('markdown-it-expand-tabs');
        }
        if (this.options.abbr) {
            this.modules.abbr = require('markdown-it-abbr');
        }
        if (this.options.anchor) {
            this.modules.anchor = require('markdown-it-anchor');
        }
        if (this.options.attrs) {
            this.modules.attrs = require('markdown-it-attrs');
        }
        if (this.options.deflist) {
            this.modules.deflist = require('markdown-it-deflist');
        }
        if (this.options.footnote) {
            this.modules.footnote = require('markdown-it-footnote');
        }
        if (this.options.highlightjs) {
            this.modules.highlightjs = require('markdown-it-highlightjs');
        }
        if (this.options.ins) {
            this.modules.ins = require('markdown-it-ins');
        }
        if (this.options.mark) {
            this.modules.mark = require('markdown-it-mark');
        }
        if (this.options.sub) {
            this.modules.sub = require('markdown-it-sub');
        }
        if (this.options.sup) {
            this.modules.sup = require('markdown-it-sup');
        }
        if (this.options.mermaid) {
            this.modules.mermaid = require('markdown-it-mermaid-less');
        }
    }
    getRenderer() {
        const mdOptions = {
            html: true,
            langPrefix: 'highlight ',
            linkify: this.options.linkify,
        };
        const renderer = new this.modules.MarkdownIt({
            html: true,
            linkify: true,
            typographer: true,
        });
        if (this.options.taskLists) {
            renderer.use(this.modules.taskLists, { enabled: true, label: true });
        }
        if (this.options.lazyHeaders) {
            renderer.use(this.modules.lazyHeaders, {});
        }
        if (this.options.emoji) {
            renderer.use(this.modules.emoji, { shortcuts: {} });
        }
        if (this.options.expandTabs) {
            renderer.use(this.modules.expandTabs, { tabWidth: 4 });
        }
        if (this.options.abbr) {
            renderer.use(this.modules.abbr, {});
        }
        if (this.options.anchor) {
            renderer.use(this.modules.anchor, {});
        }
        if (this.options.attrs) {
            renderer.use(this.modules.attrs, {});
        }
        if (this.options.deflist) {
            renderer.use(this.modules.deflist, {});
        }
        if (this.options.footnote) {
            renderer.use(this.modules.footnote, {});
        }
        if (this.options.highlightjs) {
            renderer.use(this.modules.highlightjs, {});
        }
        if (this.options.ins) {
            renderer.use(this.modules.ins, {});
        }
        if (this.options.mark) {
            renderer.use(this.modules.mark, {});
        }
        if (this.options.sub) {
            renderer.use(this.modules.sub, {});
        }
        if (this.options.sup) {
            renderer.use(this.modules.sup, {});
        }
        if (this.options.mermaid) {
            renderer.use(this.modules.mermaid, this.mermaidOptions);
        }
        return renderer;
    }
}
exports.MarkdownRender = MarkdownRender;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVuZGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL3JlbmRlci9yZW5kZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDOzs7Ozs7Ozs7OztBQUViLDZCQUE2QjtBQW9DN0IsTUFBYSxjQUFjO0lBSXpCLFlBQW1CLE9BQWdDO1FBQ2pELElBQUksQ0FBQyxPQUFPLEdBQUcsT0FBTyxJQUFJLEVBQUUsQ0FBQztRQUM3QixJQUFJLENBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztRQUNsQixJQUFJLENBQUMsY0FBYyxHQUFHLEVBQUUsQ0FBQztRQUN6QixPQUFPLElBQUksQ0FBQztJQUNkLENBQUM7SUFFTSxZQUFZLENBQUMsU0FBaUI7UUFDbkMsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO1FBQ25CLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztRQUNwQyxNQUFNLENBQUMsR0FBVyxRQUFRLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQzdDLE1BQU0sQ0FBQyxHQUFXLElBQUksQ0FBQyxjQUFjLENBQUMsVUFBVSxJQUFJLEVBQUUsQ0FBQztRQUN2RCxPQUFPO1lBQ0wsSUFBSSxFQUFFLENBQUM7WUFDUCxJQUFJLEVBQUUsQ0FBQztTQUNSLENBQUM7SUFDSixDQUFDO0lBQ2EsY0FBYyxDQUFDLGVBQXVCOztZQUNsRCxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFO2dCQUN4QixJQUFJLE9BQU8sZUFBZSxLQUFLLFFBQVEsRUFBRTtvQkFDdkMsTUFBTSxLQUFLLENBQUMsaUNBQWlDLENBQUMsQ0FBQztpQkFDaEQ7Z0JBRUQsTUFBTSxrQkFBa0IsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFFdEQsTUFBTSxPQUFPLEdBQUc7b0JBQ2QsV0FBVyxFQUFFLGtCQUFrQjtpQkFDaEMsQ0FBQztnQkFFRixNQUFNLEdBQUcsR0FBYSxNQUFNLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLGlDQUFpQyxDQUNoRixlQUFlLENBQ2hCLENBQUM7Z0JBRUYsT0FBTyxHQUFHLENBQUM7YUFDWjtZQUNELE9BQU8sRUFBRSxDQUFDO1FBQ1osQ0FBQztLQUFBO0lBQ08sV0FBVztRQUNqQixJQUFJLENBQUMsT0FBTyxDQUFDLFVBQVUsR0FBRyxPQUFPLENBQUMsYUFBYSxDQUFDLENBQUM7UUFDakQsSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRTtZQUMxQixJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsR0FBRyxPQUFPLENBQUMsd0JBQXdCLENBQUMsQ0FBQztTQUM1RDtRQUNELElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxXQUFXLEVBQUU7WUFDNUIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxXQUFXLEdBQUcsT0FBTyxDQUFDLDBCQUEwQixDQUFDLENBQUM7U0FDaEU7UUFDRCxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFO1lBQ3RCLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxHQUFHLE9BQU8sQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO1NBQ25EO1FBQ0QsSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLFVBQVUsRUFBRTtZQUMzQixJQUFJLENBQUMsT0FBTyxDQUFDLFVBQVUsR0FBRyxPQUFPLENBQUMseUJBQXlCLENBQUMsQ0FBQztTQUM5RDtRQUNELElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUU7WUFDckIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEdBQUcsT0FBTyxDQUFDLGtCQUFrQixDQUFDLENBQUM7U0FDakQ7UUFDRCxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFO1lBQ3ZCLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxHQUFHLE9BQU8sQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO1NBQ3JEO1FBQ0QsSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRTtZQUN0QixJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssR0FBRyxPQUFPLENBQUMsbUJBQW1CLENBQUMsQ0FBQztTQUNuRDtRQUNELElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUU7WUFDeEIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDLHFCQUFxQixDQUFDLENBQUM7U0FDdkQ7UUFDRCxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFO1lBQ3pCLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxHQUFHLE9BQU8sQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDO1NBQ3pEO1FBQ0QsSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLFdBQVcsRUFBRTtZQUM1QixJQUFJLENBQUMsT0FBTyxDQUFDLFdBQVcsR0FBRyxPQUFPLENBQUMseUJBQXlCLENBQUMsQ0FBQztTQUMvRDtRQUNELElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUU7WUFDcEIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLEdBQUcsT0FBTyxDQUFDLGlCQUFpQixDQUFDLENBQUM7U0FDL0M7UUFDRCxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFO1lBQ3JCLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxHQUFHLE9BQU8sQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO1NBQ2pEO1FBQ0QsSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRTtZQUNwQixJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsR0FBRyxPQUFPLENBQUMsaUJBQWlCLENBQUMsQ0FBQztTQUMvQztRQUNELElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUU7WUFDcEIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLEdBQUcsT0FBTyxDQUFDLGlCQUFpQixDQUFDLENBQUM7U0FDL0M7UUFDRCxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFO1lBQ3hCLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQywwQkFBMEIsQ0FBQyxDQUFDO1NBQzVEO0lBQ0gsQ0FBQztJQUNPLFdBQVc7UUFDakIsTUFBTSxTQUFTLEdBQUc7WUFDaEIsSUFBSSxFQUFFLElBQUk7WUFDVixVQUFVLEVBQUUsWUFBWTtZQUN4QixPQUFPLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPO1NBQzlCLENBQUM7UUFDRixNQUFNLFFBQVEsR0FBRyxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDO1lBQzNDLElBQUksRUFBRSxJQUFJO1lBQ1YsT0FBTyxFQUFFLElBQUk7WUFDYixXQUFXLEVBQUUsSUFBSTtTQUNsQixDQUFDLENBQUM7UUFDSCxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFO1lBQzFCLFFBQVEsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUUsRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1NBQ3RFO1FBQ0QsSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLFdBQVcsRUFBRTtZQUM1QixRQUFRLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsV0FBVyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1NBQzVDO1FBQ0QsSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRTtZQUN0QixRQUFRLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLEVBQUUsU0FBUyxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7U0FDckQ7UUFDRCxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxFQUFFO1lBQzNCLFFBQVEsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFVLEVBQUUsRUFBRSxRQUFRLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztTQUN4RDtRQUNELElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUU7WUFDckIsUUFBUSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsQ0FBQztTQUNyQztRQUNELElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUU7WUFDdkIsUUFBUSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsQ0FBQztTQUN2QztRQUNELElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUU7WUFDdEIsUUFBUSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsQ0FBQztTQUN0QztRQUNELElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUU7WUFDeEIsUUFBUSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxFQUFFLENBQUMsQ0FBQztTQUN4QztRQUNELElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUU7WUFDekIsUUFBUSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsRUFBRSxFQUFFLENBQUMsQ0FBQztTQUN6QztRQUNELElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxXQUFXLEVBQUU7WUFDNUIsUUFBUSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFdBQVcsRUFBRSxFQUFFLENBQUMsQ0FBQztTQUM1QztRQUNELElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUU7WUFDcEIsUUFBUSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxFQUFFLENBQUMsQ0FBQztTQUNwQztRQUNELElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUU7WUFDckIsUUFBUSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsQ0FBQztTQUNyQztRQUNELElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUU7WUFDcEIsUUFBUSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxFQUFFLENBQUMsQ0FBQztTQUNwQztRQUNELElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUU7WUFDcEIsUUFBUSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxFQUFFLENBQUMsQ0FBQztTQUNwQztRQUNELElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUU7WUFFeEIsUUFBUSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUM7U0FDekQ7UUFDRCxPQUFPLFFBQVEsQ0FBQztJQUNsQixDQUFDO0NBQ0Y7QUFwSkQsd0NBb0pDIn0=