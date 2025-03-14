const fs = require('fs');
const path = require('path');
const config = require('../mizui.config');

const cache = new Map();

// Crash data logging function
function logCrash(templatePath, data, error) {
    const crashLog = {
        timestamp: new Date().toISOString(),
        templatePath,
        data,
        error: error.message,
    };
    fs.appendFileSync('crash.log', JSON.stringify(crashLog, null, 2) + '\n');
}

function logError(message) {
    const errorMessage = `[${new Date().toISOString()}] ERROR: ${message}\n`;
    fs.appendFileSync('error.log', errorMessage);
    console.error(errorMessage);
}

function templateGet(templatePath) {
    try {
        if (!fs.existsSync(templatePath)) {
            throw new Error(`Template file not found: ${templatePath}`);
        }
        if (cache.has(templatePath)) {
            return cache.get(templatePath);
        }
        const content = fs.readFileSync(templatePath, 'utf8');
        cache.set(templatePath, content);
        return content;
    } catch (err) {
        logError(err.message);
        return '';
    }
}

function syntaxCheck(template, templatePath) {
    const [open, close] = config.syntax;
    const regexOpen = new RegExp(`\\${open}`, 'g');
    const regexClose = new RegExp(`\\${close}`, 'g');
    const lines = template.split('\n');

    lines.forEach((line, lineIndex) => {
        const openMatches = [...line.matchAll(regexOpen)];
        const closeMatches = [...line.matchAll(regexClose)];
        if (openMatches.length !== closeMatches.length) {
            logError(`Syntax Error in ${templatePath} at Line ${lineIndex + 1}: Missing '${close}'`);
            throw new Error(`Syntax Error in ${templatePath} at Line ${lineIndex + 1}`);
        }
    });
}

function parsing(template, templatePath) {
    try {
        syntaxCheck(template, templatePath);
        const [open, close] = config.syntax.map(s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
        const regex = new RegExp(`${open}\s*(.*?)\s*${close}`, 'g');
        return template.replace(regex, (match, key) => `\${typeof data.${key.trim()} !== 'undefined' ? data.${key.trim()} : ''}`);
    } catch (err) {
        logError(`Parsing error in ${templatePath}: ${err.message}`);
        throw err;
    }
}

function parsedTemplateComponent(template, depth = 0, templatePath = '') {
    if (depth > 10) {
        logError(`Infinite recursion detected in ${templatePath}`);
        throw new Error(`Infinite recursion detected in ${templatePath}`);
    }
    return template.replace(/{{\s*component\((.*?)\)\s*}}/g, (match, key) => {
        let componentPath = path.join(config.basePath, `${key.trim()}.mizui`);
        if (!fs.existsSync(componentPath)) {
            logError(`Component not found: ${componentPath}`);
            throw new Error(`Component not found: ${componentPath}`);
        }
        return parsedTemplateComponent(templateGet(componentPath), depth + 1, componentPath);
    });
}

function compilation(parsedTemplate, templatePath) {
    try {
        return new Function('data', `return \`${parsedTemplate}\`;`);
    } catch (err) {
        logError(`Compilation error in ${templatePath}: ${err.message}`);
        throw err;
    }
}

function render(templatePath, data) {
    try {
        let template = templateGet(templatePath);
        if (!template) return '';
        template = parsedTemplateComponent(template, 0, templatePath);
        const parsedTemplate = parsing(template, templatePath);
        if (!cache.has(parsedTemplate)) {
            cache.set(parsedTemplate, compilation(parsedTemplate, templatePath));
        }
        return cache.get(parsedTemplate)(data);
    } catch (err) {
        logError(`Rendering error in ${templatePath}: ${err.message}`);
        logCrash(templatePath, data, err);
        return '';
    }
}

module.exports = { render };
