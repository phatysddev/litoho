import { LuiBadge } from "./badge.js";
import { LuiButton } from "./button.js";
import {
  LuiCard,
  LuiCardContent,
  LuiCardDescription,
  LuiCardFooter,
  LuiCardHeader,
  LuiCardTitle
} from "./card.js";
import { LuiInput, LuiTextarea } from "./input.js";
import {
  LuiDialog,
  LuiDialogClose,
  LuiDialogContent,
  LuiDialogDescription,
  LuiDialogFooter,
  LuiDialogTitle,
  LuiDialogTrigger
} from "./dialog.js";
import {
  LuiDropdownContent,
  LuiDropdownItem,
  LuiDropdownMenu,
  LuiDropdownSeparator,
  LuiDropdownTrigger
} from "./dropdown.js";
import { LuiSelect, LuiSelectOption } from "./select.js";
import { LuiTabs, LuiTabsContent, LuiTabsList, LuiTabsTrigger } from "./tabs.js";
import { LuiToastRegion, showToast } from "./toast.js";

export { LuiBadge } from "./badge.js";
export type { LuiBadgeVariant } from "./badge.js";
export { LuiButton } from "./button.js";
export type { LuiButtonSize, LuiButtonVariant } from "./button.js";
export {
  LuiCard,
  LuiCardContent,
  LuiCardDescription,
  LuiCardFooter,
  LuiCardHeader,
  LuiCardTitle
} from "./card.js";
export { LuiInput, LuiTextarea } from "./input.js";
export {
  LuiDialog,
  LuiDialogClose,
  LuiDialogContent,
  LuiDialogDescription,
  LuiDialogFooter,
  LuiDialogTitle,
  LuiDialogTrigger
} from "./dialog.js";
export {
  LuiDropdownContent,
  LuiDropdownItem,
  LuiDropdownMenu,
  LuiDropdownSeparator,
  LuiDropdownTrigger
} from "./dropdown.js";
export { LuiSelect, LuiSelectOption } from "./select.js";
export { LuiTabs, LuiTabsContent, LuiTabsList, LuiTabsTrigger } from "./tabs.js";
export { LuiToastRegion, showToast } from "./toast.js";

defineElement("lui-button", LuiButton);
defineElement("lui-badge", LuiBadge);
defineElement("lui-card", LuiCard);
defineElement("lui-card-header", LuiCardHeader);
defineElement("lui-card-title", LuiCardTitle);
defineElement("lui-card-description", LuiCardDescription);
defineElement("lui-card-content", LuiCardContent);
defineElement("lui-card-footer", LuiCardFooter);
defineElement("lui-input", LuiInput);
defineElement("lui-textarea", LuiTextarea);
defineElement("lui-dialog", LuiDialog);
defineElement("lui-dialog-trigger", LuiDialogTrigger);
defineElement("lui-dialog-close", LuiDialogClose);
defineElement("lui-dialog-content", LuiDialogContent);
defineElement("lui-dialog-title", LuiDialogTitle);
defineElement("lui-dialog-description", LuiDialogDescription);
defineElement("lui-dialog-footer", LuiDialogFooter);
defineElement("lui-dropdown-menu", LuiDropdownMenu);
defineElement("lui-dropdown-trigger", LuiDropdownTrigger);
defineElement("lui-dropdown-content", LuiDropdownContent);
defineElement("lui-dropdown-item", LuiDropdownItem);
defineElement("lui-dropdown-separator", LuiDropdownSeparator);
defineElement("lui-tabs", LuiTabs);
defineElement("lui-tabs-list", LuiTabsList);
defineElement("lui-tabs-trigger", LuiTabsTrigger);
defineElement("lui-tabs-content", LuiTabsContent);
defineElement("lui-toast-region", LuiToastRegion);
defineElement("lui-select", LuiSelect);
defineElement("lui-select-option", LuiSelectOption);

function defineElement(name: string, definition: CustomElementConstructor) {
  if (typeof customElements === "undefined") {
    return;
  }

  if (!customElements.get(name)) {
    customElements.define(name, definition);
  }
}
