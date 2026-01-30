// YAML Frontmatter Parser for Looppool IDE
// Zero-dependency implementation following project philosophy

export class YAMLParser {
    /**
     * Parse YAML frontmatter from markdown content
     * @param {string} content - The full markdown content
     * @returns {{frontmatter: Object|null, content: string}} Parsed frontmatter and remaining content
     */
    static parseFrontmatter(content) {
        // Match frontmatter between --- delimiters
        const frontmatterRegex = /^---\r?\n([\s\S]*?)\r?\n---/;
        const match = content.match(frontmatterRegex);
        
        if (!match) {
            return { frontmatter: null, content };
        }
        
        const yamlContent = match[1];
        const remainingContent = content.slice(match[0].length).trim();
        
        try {
            const frontmatter = this.parseYAML(yamlContent);
            return { frontmatter, content: remainingContent };
        } catch (error) {
            console.error('YAML parsing error:', error);
            return { frontmatter: null, content };
        }
    }
    
    /**
     * Parse simple YAML content (subset needed for frontmatter)
     * Supports: strings, arrays, simple key-value pairs
     * @param {string} yaml - YAML string to parse
     * @returns {Object} Parsed YAML object
     */
    static parseYAML(yaml) {
        const result = {};
        const lines = yaml.split(/\r?\n/);
        let currentKey = null;
        let inArray = false;
        let arrayItems = [];
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmedLine = line.trim();
            
            // Skip empty lines and comments
            if (!trimmedLine || trimmedLine.startsWith('#')) {
                continue;
            }
            
            // Handle array items
            if (trimmedLine.startsWith('- ')) {
                if (!inArray || !currentKey) {
                    throw new Error(`Unexpected array item at line ${i + 1}`);
                }
                const value = this.parseValue(trimmedLine.substring(2).trim());
                arrayItems.push(value);
                continue;
            }
            
            // If we were in an array, save it
            if (inArray && currentKey && !trimmedLine.startsWith('- ')) {
                result[currentKey] = arrayItems;
                inArray = false;
                arrayItems = [];
                currentKey = null;
            }
            
            // Handle key-value pairs
            const colonIndex = line.indexOf(':');
            if (colonIndex === -1) {
                throw new Error(`Invalid YAML syntax at line ${i + 1}: ${line}`);
            }
            
            const key = line.substring(0, colonIndex).trim();
            const valueStr = line.substring(colonIndex + 1).trim();
            
            if (!key) {
                throw new Error(`Empty key at line ${i + 1}`);
            }
            
            // Check if value is empty (array will follow)
            if (!valueStr) {
                currentKey = key;
                inArray = true;
                arrayItems = [];
            } else {
                // Parse inline value
                const value = this.parseValue(valueStr);
                result[key] = value;
            }
        }
        
        // Handle any remaining array
        if (inArray && currentKey) {
            result[currentKey] = arrayItems;
        }
        
        return result;
    }
    
    /**
     * Parse a YAML value (string, number, boolean, or array)
     * @param {string} value - Value string to parse
     * @returns {any} Parsed value
     */
    static parseValue(value) {
        // Handle quoted strings
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
            return value.slice(1, -1);
        }
        
        // Handle inline arrays [item1, item2, ...]
        if (value.startsWith('[') && value.endsWith(']')) {
            const arrayContent = value.slice(1, -1);
            if (!arrayContent.trim()) return [];
            
            return arrayContent.split(',').map(item => {
                const trimmed = item.trim();
                return this.parseValue(trimmed);
            });
        }
        
        // Handle booleans
        if (value === 'true') return true;
        if (value === 'false') return false;
        
        // Handle null/undefined
        if (value === 'null' || value === '~') return null;
        
        // Handle numbers
        if (/^-?\d+$/.test(value)) {
            return parseInt(value, 10);
        }
        if (/^-?\d*\.\d+$/.test(value)) {
            return parseFloat(value);
        }
        
        // Return as string
        return value;
    }
    
    /**
     * Parse legacy arguments format (for commands like set-profile)
     * @param {Array} args - Arguments array from frontmatter
     * @returns {string} Formatted argument hint
     */
    static formatLegacyArguments(args) {
        if (!Array.isArray(args)) return '';
        
        return args.map(arg => {
            const name = arg.name || 'arg';
            const required = arg.required === true;
            return required ? `<${name}>` : `[${name}]`;
        }).join(' ');
    }
    
    /**
     * Extract and normalize frontmatter data for display
     * @param {Object} frontmatter - Parsed frontmatter object
     * @returns {Object} Normalized frontmatter data
     */
    static normalizeFrontmatter(frontmatter) {
        if (!frontmatter) return null;
        
        const normalized = {
            name: frontmatter.name || 'Unknown',
            description: frontmatter.description || 'No description',
            argumentHint: frontmatter['argument-hint'] || '',
            allowedTools: frontmatter['allowed-tools'] || [],
            agent: frontmatter.agent || null
        };
        
        // Handle legacy arguments format
        if (frontmatter.arguments && !normalized.argumentHint) {
            normalized.argumentHint = this.formatLegacyArguments(frontmatter.arguments);
        }
        
        return normalized;
    }
}

// Export for use in other modules
export default YAMLParser;