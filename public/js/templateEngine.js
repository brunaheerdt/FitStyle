class TemplateEngine {
    constructor() {
        this.templates = new Map();
        this.cache = new Map();
    }

    async loadTemplate(name) {
        if (this.cache.has(name)) {
            return this.cache.get(name);
        }

        try {
            const response = await fetch(`/templates/${name}.html`);
            if (!response.ok) {
                throw new Error(`Template ${name} not found`);
            }
            const template = await response.text();
            this.cache.set(name, template);
            return template;
        } catch (error) {
            console.error(`Error loading template ${name}:`, error);
            return null;
        }
    }

    render(template, data = {}) {
        if (!template) return '';
        
        return template.replace(/\{\{([^}]+)\}\}/g, (_, key) => {
            const keys = key.trim().split('.');
            let value = data;
            
            for (const k of keys) {
                if (value && typeof value === 'object' && k in value) {
                    value = value[k];
                } else {
                    return '';
                }
            }
            
            if (typeof value === 'function') {
                return value();
            }
            
            return value !== null && value !== undefined ? value : '';
        });
    }

    renderLoop(template, items) {
        if (!Array.isArray(items) || items.length === 0) {
            return template.replace(/\{\{#each items\}\}[\s\S]*?\{\{\/each\}\}/g, '');
        }

        return template.replace(/\{\{#each items\}\}([\s\S]*?)\{\{\/each\}\}/g, (_, content) => {
            return items.map(item => this.render(content, item)).join('');
        });
    }

    renderConditional(template, data) {
        return template.replace(/\{\{#if ([^}]+)\}\}([\s\S]*?)(?:\{\{else\}\}([\s\S]*?))?\{\{\/if\}\}/g, (_, condition, trueContent, falseContent = '') => {
            const keys = condition.trim().split('.');
            let value = data;
            
            for (const k of keys) {
                if (value && typeof value === 'object' && k in value) {
                    value = value[k];
                } else {
                    value = false;
                    break;
                }
            }
            
            return value ? this.render(trueContent, data) : this.render(falseContent, data);
        });
    }

    async renderTemplate(name, data = {}) {
        const template = await this.loadTemplate(name);
        if (!template) return '';
        
        let rendered = this.renderConditional(template, data);
        rendered = this.renderLoop(rendered, data.items || []);
        rendered = this.render(rendered, data);
        
        return rendered;
    }
}

const templateEngine = new TemplateEngine();
