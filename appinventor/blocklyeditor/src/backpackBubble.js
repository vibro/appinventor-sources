/**
 * Visual Blocks Editor
 *
 * Copyright 2012 Google Inc.
 * http://blockly.googlecode.com/
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview Object representing a UI bubble.
 * @author fraser@google.com (Neil Fraser)
 */
'use strict';

goog.provide('Blockly.BackpackBubble');

goog.require('Blockly.Workspace');


/**
 * Class for UI bubble.
 * @param {!Blockly.Workspace} workspace The workspace on which to draw the
 *     bubble.
 * @param {!Element} content SVG content for the bubble.
 * @param {?number} bubbleWidth Width of bubble, or null if not resizable.
 * @param {?number} bubbleHeight Height of bubble, or null if not resizable.
 * @constructor
 */
Blockly.BackpackBubble = function(workspace, content,
                          bubbleWidth, bubbleHeight) {
    
  this.workspace_ = workspace;
  this.content_ = content;
  var canvas = workspace.getBubbleCanvas();
  canvas.appendChild(this.createDom_(content, !!(bubbleWidth && bubbleHeight)));

  if (!bubbleWidth || !bubbleHeight) {
    try {
      var bBox = /** @type {SVGLocatable} */ (this.content_).getBBox();
    } catch (e) {
        // Firefox has trouble with hidden elements (Bug 528969).
      var bBox = {height: 0, width: 0};
    }
    bubbleWidth = bBox.width + 2 * Blockly.BackpackBubble.BORDER_WIDTH;
    bubbleHeight = bBox.height + 2 * Blockly.BackpackBubble.BORDER_WIDTH;
  }
  this.setBubbleSize(bubbleWidth, bubbleHeight);

  // Render the bubble.
  this.positionBubble_();  
  this.rendered_ = true;

  if (!Blockly.readOnly) {
    //revisit for dragging etc
    Blockly.bindEvent_(this.bubbleBack_, 'mousedown', this,
                       this.bubbleMouseDown_);
    if (this.resizeGroup_) {
      Blockly.bindEvent_(this.resizeGroup_, 'mousedown', this,
                         this.resizeMouseDown_);
    }
  }
};

/**
 * Width of the border around the bubble.
 */
Blockly.BackpackBubble.BORDER_WIDTH = 6;

/**
 * Wrapper function called when a mouseUp occurs during a drag operation.
 * @type {Array.<!Array>}
 * @private
 */
Blockly.BackpackBubble.onMouseUpWrapper_ = null;

/**
 * Wrapper function called when a mouseMove occurs during a drag operation.
 * @type {Array.<!Array>}
 * @private
 */
Blockly.BackpackBubble.onMouseMoveWrapper_ = null;

/**
 * Stop binding to the global mouseup and mousemove events.
 * @private
 */
Blockly.BackpackBubble.unbindDragEvents_ = function() {
  if (Blockly.BackpackBubble.onMouseUpWrapper_) {
    Blockly.unbindEvent_(Blockly.BackpackBubble.onMouseUpWrapper_);
    Blockly.BackpackBubble.onMouseUpWrapper_ = null;
  }
  if (Blockly.BackpackBubble.onMouseMoveWrapper_) {
    Blockly.unbindEvent_(Blockly.BackpackBubble.onMouseMoveWrapper_);
    Blockly.BackpackBubble.onMouseMoveWrapper_ = null;
  }
};

/**
 * Flag to stop incremental rendering during construction.
 * @private
 */
Blockly.BackpackBubble.prototype.rendered_ = false;

/**
 * Width of BackpackBubble.
 * @private
 */
Blockly.BackpackBubble.prototype.width_ = 0;

/**
 * Height of BackpackBubble.
 * @private
 */
Blockly.BackpackBubble.prototype.height_ = 0;

/**
 * Create the BackpackBubble's DOM.
 * @param {!Element} content SVG content for the BackpackBubble.
 * @param {boolean} hasResize Add diagonal resize gripper if true.
 * @return {!Element} The BackpackBubble's SVG group.
 * @private
 */
Blockly.BackpackBubble.prototype.createDom_ = function(content, hasResize) {
  /* Create the bubble.  Here's the markup that will be generated:
  <g>
    <g filter="url(#blocklyEmboss)">
      <path d="... Z" />
      <rect class="blocklyDraggable" rx="8" ry="8" width="180" height="180"/>
    </g>
    <g transform="translate(165, 165)" class="blocklyResizeSE">
      <polygon points="0,15 15,15 15,0"/>
      <line class="blocklyResizeLine" x1="5" y1="14" x2="14" y2="5"/>
      <line class="blocklyResizeLine" x1="10" y1="14" x2="14" y2="10"/>
    </g>
    [...content goes here...]
  </g>
  */
  this.bubbleGroup_ = Blockly.createSvgElement('g', {}, null);
  var bubbleEmboss = Blockly.createSvgElement('g',
      {'filter': 'url(#blocklyEmboss)'}, this.bubbleGroup_);
  this.bubbleBack_ = Blockly.createSvgElement('rect',
      {'class': 'blocklyDraggable', 'x': 0, 'y': 0,
      'rx': Blockly.BackpackBubble.BORDER_WIDTH, 'ry': Blockly.BackpackBubble.BORDER_WIDTH},
      bubbleEmboss);
  if (hasResize) {
    this.resizeGroup_ = Blockly.createSvgElement('g',
        {'class': Blockly.RTL ? 'blocklyResizeSW' : 'blocklyResizeSE'},
        this.bubbleGroup_);
    var resizeSize = 2 * Blockly.BackpackBubble.BORDER_WIDTH;
    //do we need the lines?
    Blockly.createSvgElement('polygon',
        {'points': '0,x x,x x,0'.replace(/x/g, resizeSize.toString())},
        this.resizeGroup_);
    Blockly.createSvgElement('line',
        {'class': 'blocklyResizeLine',
        'x1': resizeSize / 3, 'y1': resizeSize - 1,
        'x2': resizeSize - 1, 'y2': resizeSize / 3}, this.resizeGroup_);
    Blockly.createSvgElement('line',
        {'class': 'blocklyResizeLine',
        'x1': resizeSize * 2 / 3, 'y1': resizeSize - 1,
        'x2': resizeSize - 1, 'y2': resizeSize * 2 / 3}, this.resizeGroup_);
  } else {
    this.resizeGroup_ = null;
  }
  this.bubbleGroup_.appendChild(content);
  return this.bubbleGroup_;
};

/**
 * Handle a mouse-down on bubble's border.
 * @param {!Event} e Mouse down event.
 * @private
 */
Blockly.BackpackBubble.prototype.bubbleMouseDown_ = function(e) {
  this.promote_();
  Blockly.BackpackBubble.unbindDragEvents_();
  if (Blockly.isRightButton(e)) {
    // Right-click.
    return;
  } else if (Blockly.isTargetInput_(e)) {
    // When focused on an HTML text input widget, don't trap any events.
    return;
  }
  // Left-click (or middle click)
  Blockly.setCursorHand_(true);
  // Record the starting offset between the current location and the mouse.
  if (Blockly.RTL) {
    this.dragDeltaX = this.relativeLeft_ + e.clientX;
  } else {
    this.dragDeltaX = this.relativeLeft_ - e.clientX;
  }
  this.dragDeltaY = this.relativeTop_ - e.clientY;

  Blockly.BackpackBubble.onMouseUpWrapper_ = Blockly.bindEvent_(document,
      'mouseup', this, Blockly.BackpackBubble.unbindDragEvents_);
  Blockly.BackpackBubble.onMouseMoveWrapper_ = Blockly.bindEvent_(document,
      'mousemove', this, this.bubbleMouseMove_);
  Blockly.hideChaff();
  // This event has been handled.  No need to bubble up to the document.
  e.stopPropagation();
};

/**
 * Drag this bubble to follow the mouse.
 * @param {!Event} e Mouse move event.
 * @private
 */
Blockly.BackpackBubble.prototype.bubbleMouseMove_ = function(e) {
  this.autoLayout_ = false;
  if (Blockly.RTL) {
    this.relativeLeft_ = this.dragDeltaX - e.clientX;
  } else {
    this.relativeLeft_ = this.dragDeltaX + e.clientX;
  }
  this.relativeTop_ = this.dragDeltaY + e.clientY;
  this.positionBubble_();
};

/**
 * Handle a mouse-down on bubble's resize corner.
 * @param {!Event} e Mouse down event.
 * @private
 */
Blockly.BackpackBubble.prototype.resizeMouseDown_ = function(e) {
  this.promote_();
  Blockly.BackpackBubble.unbindDragEvents_();
  if (Blockly.isRightButton(e)) {
    // Right-click.
    return;
  }
  // Left-click (or middle click)
  Blockly.setCursorHand_(true);
  // Record the starting offset between the current location and the mouse.
  if (Blockly.RTL) {
    this.resizeDeltaWidth = this.width_ + e.clientX;
  } else {
    this.resizeDeltaWidth = this.width_ - e.clientX;
  }
  this.resizeDeltaHeight = this.height_ - e.clientY;

  Blockly.BackpackBubble.onMouseUpWrapper_ = Blockly.bindEvent_(document,
      'mouseup', this, Blockly.BackpackBubble.unbindDragEvents_);
  Blockly.BackpackBubble.onMouseMoveWrapper_ = Blockly.bindEvent_(document,
      'mousemove', this, this.resizeMouseMove_);
  Blockly.hideChaff();
  // This event has been handled.  No need to bubble up to the document.
  e.stopPropagation();
};

/**
 * Resize this bubble to follow the mouse.
 * @param {!Event} e Mouse move event.
 * @private
 */
Blockly.BackpackBubble.prototype.resizeMouseMove_ = function(e) {
  this.autoLayout_ = false;
  var w = this.resizeDeltaWidth;
  var h = this.resizeDeltaHeight + e.clientY;
  if (Blockly.RTL) {
    // RTL drags the bottom-left corner.
    w -= e.clientX;
  } else {
    // LTR drags the bottom-right corner.
    w += e.clientX;
  }
  this.setBubbleSize(w, h);
  if (Blockly.RTL) {
    // RTL requires the bubble to move its left edge.
    this.positionBubble_();
  }
};

/**
 * Register a function as a callback event for when the bubble is resized.
 * @param {Object} thisObject The value of 'this' in the callback.
 * @param {!Function} callback The function to call on resize.
 */
Blockly.BackpackBubble.prototype.registerResizeEvent = function(thisObject, callback) {
  Blockly.bindEvent_(this.bubbleGroup_, 'resize', thisObject, callback);
};

/**
 * Move this bubble to the top of the stack.
 * @private
 */
Blockly.BackpackBubble.prototype.promote_ = function() {
  var svgGroup = this.bubbleGroup_.parentNode;
  svgGroup.appendChild(this.bubbleGroup_);
};


/**
 * Position the bubble so that it does not fall offscreen.
 * @private
 */
Blockly.BackpackBubble.prototype.layoutBubble_ = function() {
  // Compute the preferred bubble location.
  var relativeLeft = -this.width_ / 4;
  var relativeTop = -this.height_ - Blockly.BlockSvg.MIN_BLOCK_Y;
  var metrics;
  if (this.workspace_.scrollbar) {
    // Fetch the workspace's metrics, if they exist.
    var metrics = this.workspace_.getMetrics();
    if (this.anchorX_ + relativeLeft <
        Blockly.BlockSvg.SEP_SPACE_X + metrics.viewLeft) {
      // Slide the bubble right until it is onscreen.
      relativeLeft = Blockly.BlockSvg.SEP_SPACE_X + metrics.viewLeft -
          this.anchorX_;
    } else if (metrics.viewLeft + metrics.viewWidth <
        this.anchorX_ + relativeLeft + this.width_ +
        Blockly.BlockSvg.SEP_SPACE_X +
        Blockly.Scrollbar.scrollbarThickness) {
      // Slide the bubble left until it is onscreen.
      relativeLeft = metrics.viewLeft + metrics.viewWidth - this.anchorX_ -
          this.width_ - Blockly.BlockSvg.SEP_SPACE_X -
          Blockly.Scrollbar.scrollbarThickness;
    }
    if (this.anchorY_ + relativeTop <
        Blockly.BlockSvg.SEP_SPACE_Y + metrics.viewTop) {
      // Slide the bubble below the block.
      var bBox = /** @type {SVGLocatable} */ (this.shape_).getBBox();
      relativeTop = bBox.height;
    }
  }
  this.relativeLeft_ = relativeLeft;
  this.relativeTop_ = relativeTop;
};

/**
 * Move the bubble to a location relative to the anchor's centre.
 * @private
 */
Blockly.BackpackBubble.prototype.positionBubble_ = function() {
  
  /*this.bubbleGroup_.setAttribute('transform',
      'translate(' + left + ', ' + top + ')');
  */
}; 

/**
 * Get the dimensions of this bubble.
 * @return {!Object} Object with width and height properties.
 */
Blockly.BackpackBubble.prototype.getBubbleSize = function() {
  return {width: this.width_, height: this.height_};
};

/**
 * Size this bubble.
 * @param {number} width Width of the bubble.
 * @param {number} height Height of the bubble.
 */
Blockly.BackpackBubble.prototype.setBubbleSize = function(width, height) {
  var doubleBorderWidth = 2 * Blockly.BackpackBubble.BORDER_WIDTH;
  // Minimum size of a bubble.
  width = Math.max(width, doubleBorderWidth + 45);
  height = Math.max(height, doubleBorderWidth + Blockly.BlockSvg.TITLE_HEIGHT);
  this.width_ = width;
  this.height_ = height;
  this.bubbleBack_.setAttribute('width', width);
  this.bubbleBack_.setAttribute('height', height);
  if (this.resizeGroup_) {
    if (Blockly.RTL) {
      // Mirror the resize group.
      var resizeSize = 2 * Blockly.BackpackBubble.BORDER_WIDTH;
      this.resizeGroup_.setAttribute('transform', 'translate(' +
          resizeSize + ', ' +
          (height - doubleBorderWidth) + ') scale(-1 1)');
    } else {
      this.resizeGroup_.setAttribute('transform', 'translate(' +
          (width - doubleBorderWidth) + ', ' +
          (height - doubleBorderWidth) + ')');
    }
  }
  if (this.rendered_) {
    if (this.autoLayout_) {
      this.layoutBubble_();
    }
    this.positionBubble_();
  }
  // Fire an event to allow the contents to resize.
  Blockly.fireUiEvent(this.bubbleGroup_, 'resize');
};

/**
 * Change the colour of a bubble.
 * @param {string} hexColour Hex code of colour.
 */
Blockly.BackpackBubble.prototype.setColour = function(hexColour) {
  this.bubbleBack_.setAttribute('fill', hexColour);
};

/**
 * Dispose of this bubble.
 */
Blockly.BackpackBubble.prototype.dispose = function() {
  Blockly.BackpackBubble.unbindDragEvents_();
  // Dispose of and unlink the bubble.
  goog.dom.removeNode(this.bubbleGroup_);
  this.bubbleGroup_ = null;
  this.workspace_ = null;
  this.content_ = null;
};
