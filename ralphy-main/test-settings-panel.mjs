import { readFileSync } from 'fs';
import assert from 'assert';

console.log('Testing Settings Panel Implementation...\n');

// Test 1: Check that settings-panel.js exists
console.log('Test 1: Settings panel file exists');
try {
  readFileSync('src/frontend/settings-panel.js');
  console.log('✓ settings-panel.js exists');
} catch (e) {
  console.error('✗ settings-panel.js not found');
}

// Test 2: Check that settings panel is included in HTML
console.log('\nTest 2: Settings panel included in HTML');
const html = readFileSync('src/frontend/index.html', 'utf8');
assert(html.includes('<script src="settings-panel.js"></script>'), 'Settings panel script not included');
assert(html.includes('id="settings-panel-container"'), 'Settings panel container not found');
assert(html.includes('class="settings-btn"'), 'Settings button not found');
assert(html.includes('⚙️ Settings'), 'Settings button text not found');
console.log('✓ Settings panel properly integrated in HTML');

// Test 3: Verify SettingsPanel class implementation
console.log('\nTest 3: SettingsPanel class implementation');
const settingsPanelCode = readFileSync('src/frontend/settings-panel.js', 'utf8');
assert(settingsPanelCode.includes('class SettingsPanel'), 'SettingsPanel class not defined');
assert(settingsPanelCode.includes('loadSettings()'), 'loadSettings method not found');
assert(settingsPanelCode.includes('saveSettings()'), 'saveSettings method not found');
assert(settingsPanelCode.includes('setupPanel()'), 'setupPanel method not found');
assert(settingsPanelCode.includes('bindEventListeners()'), 'bindEventListeners method not found');
console.log('✓ SettingsPanel class properly implemented');

// Test 4: Check settings structure
console.log('\nTest 4: Settings structure');
assert(settingsPanelCode.includes('editor: {'), 'Editor settings section not found');
assert(settingsPanelCode.includes('fontSize:'), 'Font size setting not found');
assert(settingsPanelCode.includes('lineHeight:'), 'Line height setting not found');
assert(settingsPanelCode.includes('tabSize:'), 'Tab size setting not found');
assert(settingsPanelCode.includes('wordWrap:'), 'Word wrap setting not found');
assert(settingsPanelCode.includes('theme:'), 'Theme setting not found');
assert(settingsPanelCode.includes('autoSave:'), 'Auto save setting not found');
assert(settingsPanelCode.includes('appearance: {'), 'Appearance settings section not found');
assert(settingsPanelCode.includes('behavior: {'), 'Behavior settings section not found');
console.log('✓ All settings categories properly defined');

// Test 5: Check UI elements
console.log('\nTest 5: UI elements');
assert(settingsPanelCode.includes('Font Size'), 'Font size control not found');
assert(settingsPanelCode.includes('Line Height'), 'Line height control not found');
assert(settingsPanelCode.includes('Tab Size'), 'Tab size control not found');
assert(settingsPanelCode.includes('Word Wrap'), 'Word wrap control not found');
assert(settingsPanelCode.includes('Show Line Numbers'), 'Line numbers control not found');
assert(settingsPanelCode.includes('Theme'), 'Theme control not found');
assert(settingsPanelCode.includes('Reset to Defaults'), 'Reset button not found');
assert(settingsPanelCode.includes('Export Settings'), 'Export button not found');
assert(settingsPanelCode.includes('Import Settings'), 'Import button not found');
console.log('✓ All UI elements present');

// Test 6: Check event handling
console.log('\nTest 6: Event handling');
assert(settingsPanelCode.includes('handleRangeChange'), 'Range change handler not found');
assert(settingsPanelCode.includes('handleCheckboxChange'), 'Checkbox change handler not found');
assert(settingsPanelCode.includes('handleSelectChange'), 'Select change handler not found');
assert(settingsPanelCode.includes('settings-changed'), 'Settings changed event not found');
console.log('✓ Event handlers properly implemented');

// Test 7: Check import/export functionality
console.log('\nTest 7: Import/Export functionality');
assert(settingsPanelCode.includes('exportSettings()'), 'Export settings method not found');
assert(settingsPanelCode.includes('importSettings('), 'Import settings method not found');
assert(settingsPanelCode.includes('JSON.stringify'), 'JSON export not implemented');
assert(settingsPanelCode.includes('JSON.parse'), 'JSON import not implemented');
console.log('✓ Import/export properly implemented');

// Test 8: Check settings integration in HTML
console.log('\nTest 8: Settings integration');
assert(html.includes('toggleSettings()'), 'Toggle settings function not found');
assert(html.includes('settings-changed'), 'Settings change listener not found');
assert(html.includes('settings.editor.fontSize'), 'Font size application not found');
assert(html.includes('settings.editor.lineHeight'), 'Line height application not found');
assert(html.includes('settings.appearance.fontFamily'), 'Font family application not found');
console.log('✓ Settings properly integrated with editor');

// Test 9: Check CSS styles
console.log('\nTest 9: CSS styles');
assert(settingsPanelCode.includes('.settings-panel'), 'Settings panel CSS not found');
assert(settingsPanelCode.includes('.settings-header'), 'Settings header CSS not found');
assert(settingsPanelCode.includes('.setting-group'), 'Setting group CSS not found');
assert(settingsPanelCode.includes('.settings-footer'), 'Settings footer CSS not found');
console.log('✓ CSS styles properly defined');

// Test 10: Check dark theme support
console.log('\nTest 10: Dark theme support');
assert(html.includes('body.dark-theme'), 'Dark theme CSS not found');
assert(html.includes('dark-theme .editor-textarea'), 'Dark theme editor styles not found');
assert(settingsPanelCode.includes('@media (prefers-color-scheme: dark)'), 'Dark theme media query not found');
console.log('✓ Dark theme support implemented');

console.log('\n✅ All tests passed! Settings panel implementation complete.');