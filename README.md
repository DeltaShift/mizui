# Mizui Template Engine

Mizui is a lightweight and efficient template engine developed by [mizukaze554](https://github.com/mizukaze554) under the [DeltaShift](https://github.com/DeltaShift) organization. It offers customizable syntax, component-based rendering, and optimized performance with caching.

## Features
- **Customizable Syntax:** Define your own delimiters (e.g., `{{}}` → `(())`).
- **Component System:** Reusable templates with `component()` function.
- **Performance Optimizations:** Efficient caching to improve rendering speed.
- **Crash Data Logging:** Automatically logs errors in `crash.log` for debugging.
- **Configurable Settings:** Adjust base paths and syntax format via `mizui.config.js`.

## Installation
```sh
npm install mizui
```

## Usage
### 1. Setup Configuration
Create a `mizui.config.js` file in the root directory:
```js
module.exports = {
    basePath: 'app/components/', // Default component directory
    syntax: ['{{', '}}'], // Customizable syntax
};
```

### 2. Create a Template
Create a `.mizui` template file (e.g., `home.mizui`):
```html
<h1>{{ title }}</h1>
<p>{{ message }}</p>
{{ component(header) }}
```

### 3. Render the Template
```js
const { render } = require('mizui');

const output = render('./home.mizui', {
    title: 'Welcome to Mizui',
    message: 'This is a lightweight template engine.',
});

console.log(output);
```

## Component Usage
Components are stored in `app/components/` (or as defined in `mizui.config.js`). Example:

`app/components/header.mizui`:
```html
<header>
    <h2>Header Section</h2>
</header>
```
Usage in a template:
```html
{{ component(header) }}
```

## Error Logging
- **Errors during rendering** are logged in `error.log`.
- **Crashes** (failed renders) are logged in `crash.log` with template path, data, and error message.

## License
Mizui is released under the [MIT License](LICENSE).
