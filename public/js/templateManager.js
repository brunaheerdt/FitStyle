class TemplateManager {
    constructor() {
        this.templates = new Map();
        this.cache = new Map();
        this.setupHelpers();
        this.partialsInitialized = false;
    }

    async ensurePartialsInitialized() {
        if (!this.partialsInitialized) {
            await this.setupPartials();
            this.partialsInitialized = true;
        }
    }

    setupHelpers() {
        // Register custom Handlebars helpers
        Handlebars.registerHelper('formatDate', function(date) {
            return new Date(date).toLocaleDateString();
        });

        Handlebars.registerHelper('eq', function(a, b) {
            return a === b;
        });

        Handlebars.registerHelper('or', function(a, b) {
            return a || b;
        });

        Handlebars.registerHelper('and', function(a, b) {
            return a && b;
        });

        Handlebars.registerHelper('lt', function(a, b) {
            return a < b;
        });

        // Helper for checking if user is admin
        Handlebars.registerHelper('isAdmin', function(userRole) {
            return userRole === 'admin';
        });

        // Helper for conditional classes
        Handlebars.registerHelper('classIf', function(condition, className) {
            return condition ? className : '';
        });

        // Helper for uppercase text
        Handlebars.registerHelper('uppercase', function(text) {
            return text ? text.toUpperCase() : '';
        });

        // Helper for truncating text
        Handlebars.registerHelper('truncate', function(text, length) {
            if (!text) return '';
            return text.length > length ? text.substring(0, length) + '...' : text;
        });
    }

    async setupPartials() {
        // Register commonly used partials
        await this.registerPartial('comment-item', 'comment-item');
        await this.registerPartial('reply-form', 'reply-form');
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
            const templateSource = await response.text();
            const compiledTemplate = Handlebars.compile(templateSource);
            this.cache.set(name, compiledTemplate);
            return compiledTemplate;
        } catch (error) {
            console.error(`Error loading template ${name}:`, error);
            return null;
        }
    }

    async render(templateName, data = {}) {
        await this.ensurePartialsInitialized();
        
        const template = await this.loadTemplate(templateName);
        if (!template) {
            console.error(`Template ${templateName} not found`);
            return '';
        }
        
        try {
            return template(data);
        } catch (error) {
            console.error(`Error rendering template ${templateName}:`, error);
            return '';
        }
    }

    // Register a partial template
    async registerPartial(name, templateName) {
        const template = await this.loadTemplate(templateName);
        if (template) {
            const response = await fetch(`/templates/${templateName}.html`);
            const templateSource = await response.text();
            Handlebars.registerPartial(name, templateSource);
        }
    }

    // Clear template cache
    clearCache() {
        this.cache.clear();
    }
}

// Create global instance
const templateManager = new TemplateManager();