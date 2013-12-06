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
 * @fileoverview Object representing a Backpack dialog.  A Backpack allows the
 * user to change the shape of a block using a nested blocks editor.
 * @author fraser@google.com (Neil Fraser)
 */
'use strict';

goog.provide('Blockly.Backpack');

goog.require('Blockly.BackpackBubble');


/**
 * Class for a Backpack dialog.
 * @param {!Array.<string>} quarkNames List of names of sub-blocks for flyout.
 * @extends {Blockly.Icon}
 * @constructor
 */
Blockly.Backpack = {};

/*function(quarkNames) {
  Blockly.Backpack.superClass_.constructor.call(this, null);
  this.quarkXml_ = [];
  // Convert the list of names into a list of XML objects for the flyout.
  for (var x = 0; x < quarkNames.length; x++) {
    var element = goog.dom.createDom('block', {'type': quarkNames[x]});
    this.quarkXml_[x] = element;
  }

}; */


/**
 * Width of workspace.
 * @private
 */
Blockly.Backpack.workspaceWidth_ = 20;

/**
 * Height of workspace.
 * @private
 */
Blockly.Backpack.workspaceHeight_ = 100;

Blockly.Backpack.isVisible = false;

Blockly.Backpack.shouldHide = false;

Blockly.Backpack.getMetrics = function() {
  return {
    viewHeight: 100,
    viewWidth: 200,  // This seem wrong, but results in correct RTL layout.
    contentHeight: 100,
    contentWidth: 200,
    viewTop: 0,
    viewLeft: 0,
    contentTop: 0,
    contentLeft: 0,
    absoluteTop: 0,
    absoluteLeft: 0
  };
}

Blockly.Backpack.createEditor_ = function() {
  /* Create the editor.  Here's the markup that will be generated:
  <svg>
    <rect class="blocklyBackpackBackground" />
    [Workspace]
  </svg>
  */
  Blockly.Backpack.svgDialog_ = Blockly.createSvgElement('svg',
      {'x': Blockly.BackpackBubble.BORDER_WIDTH, 'y': Blockly.BackpackBubble.BORDER_WIDTH},
      null);
  Blockly.Backpack.svgBackground_ = Blockly.createSvgElement('rect',
      {'class': 'blocklyBackpackBackground',
       'height': '100%', 'width': '100%'}, Blockly.Backpack.svgDialog_);

  Blockly.Backpack.workspace_ = new Blockly.Workspace(
      function() {return Blockly.Backpack.getMetrics();}, null);
  Blockly.Backpack.svgDialog_.appendChild(Blockly.Backpack.workspace_.createDom());

  //when Backpack bubble is clicked, do not close Backpack
  Blockly.bindEvent_(Blockly.Backpack.svgDialog_, 'mousedown', Blockly.Backpack.svgDialog_,
      function(e) {
        e.preventDefault();
        e.stopPropagation();
      });

  return Blockly.Backpack.svgDialog_;
};

/**
 * Callback function triggered when the bubble has resized.
 * Resize the workspace accordingly.
 * @private
 */
Blockly.Backpack.resizeBubble_ = function() {
  var doubleBorderWidth = 2 * Blockly.Bubble.BORDER_WIDTH;

  try {
    var workspaceSize = Blocky.Backpack.workspace_.getCanvas().getBBox();
  } catch (e) {
    // Firefox has trouble with hidden elements (Bug 528969).
    return;
  }

  var width;
  if (Blockly.RTL) {
    width = -workspaceSize.x;
  } else {
    width = workspaceSize.width + workspaceSize.x;
  }
  var height = Math.max(workspaceSize.height + doubleBorderWidth * 3);
                        
  width += doubleBorderWidth * 3;
  // Only resize if the size difference is significant.  Eliminates shuddering.
  if (Math.abs(Blockly.Backpack.workspaceWidth_ - width) > doubleBorderWidth ||
      Math.abs(Blockly.Backpack.workspaceHeight_ - height) > doubleBorderWidth) {
    // Record some layout information for getFlyoutMetrics_.
    Blockly.Backpack.workspaceWidth_ = width;
    Blockly.Backpack.workspaceHeight_ = height;
    // Resize the bubble.
    Blockly.Backpack.bubble_.setBubbleSize(width + doubleBorderWidth,
                               height + doubleBorderWidth);
    Blockly.Backpack.svgDialog_.setAttribute('width', Blockly.Backpack.workspaceWidth_);
    Blockly.Backpack.svgDialog_.setAttribute('height', Blockly.Backpack.workspaceHeight_);
  }

  if (Blockly.RTL) {
    // Scroll the workspace to always left-align.
    var translation = 'translate(' + this.workspaceWidth_ + ',0)';
    Blockly.Backpack.workspace_.getCanvas().setAttribute('transform', translation);
  }
};

/**
 * Show or hide the Backpack bubble.
 * @param {boolean} visible True if the bubble should be visible.
 */
Blockly.Backpack.setVisible = function(visible) {
  if (visible == Blockly.Backpack.isVisible) {
    // No change.
    return;
  }
  if (visible) {
    // Create the bubble.
    Blockly.Backpack.bubble_ = new Blockly.BackpackBubble(Blockly.mainWorkspace,
        Blockly.Backpack.createEditor_(), 200, 100);
    Blockly.Backpack.bubble_.setColour("ff0000")
   //remove these three arguments
   //make new bubble class

    /*
    var thisObj = Blockly.Backpack;
    Blockly.Backpack.flyout_.init(Blockly.Backpack.workspace_, false);
    this.flyout_.show(this.quarkXml_);

    this.rootBlock_ = this.block_.decompose(this.workspace_);
    var blocks = this.rootBlock_.getDescendants();
    for (var i = 0, child; child = blocks[i]; i++) {
      child.render();
    }
    // The root block should not be dragable or deletable.
    this.rootBlock_.setMovable(false);
    this.rootBlock_.setDeletable(false);
    var margin = this.flyout_.CORNER_RADIUS * 2;
    var x = this.flyout_.width_ + margin;
    if (Blockly.RTL) {
      x = -x;
    }
    this.rootBlock_.moveBy(x, margin);
    // Save the initial connections, then listen for further changes.
    if (this.block_.saveConnections) {
      this.block_.saveConnections(this.rootBlock_);
      this.sourceListener_ = Blockly.bindEvent_(
          this.block_.workspace.getCanvas(),
          'blocklyWorkspaceChange', this.block_,
          function() {thisObj.block_.saveConnections(thisObj.rootBlock_)});
    }
    */
    //Blockly.Backpack.resizeBubble_();
    // When the Backpack's workspace changes, update the source block.
    Blockly.bindEvent_(Blockly.Backpack.workspace_.getCanvas(), 'blocklyWorkspaceChange',
        Blockly.Backpack.block_, function() {Blockly.Backpack.workspaceChanged_();});
    Blockly.Backpack.isVisible = true
  } else {
    // Dispose of the bubble.
    Blockly.Backpack.svgDialog_ = null;
    Blockly.Backpack.svgBackground_ = null;
    Blockly.Backpack.workspace_.dispose();
    Blockly.Backpack.workspace_ = null;
    //Blockly.Backpack.rootBlock_ = null;
    Blockly.Backpack.bubble_.dispose();
    Blockly.Backpack.bubble_ = null;
    Blockly.Backpack.workspaceWidth_ = 0;
    Blockly.Backpack.workspaceHeight_ = 0;
    if (Blockly.Backpack.sourceListener_) {
      Blockly.unbindEvent_(Blockly.Backpack.sourceListener_);
      Blockly.Backpack.sourceListener_ = null;
    }
    Blockly.Backpack.isVisible = false;
  }
};

/**
 * Update the source block when the Backpack's blocks are changed.
 * Delete or bump any block that's out of bounds.
 * Fired whenever a change is made to the Backpack's workspace.
 * @private
 */
Blockly.Backpack.workspaceChanged_ = function() {
  if(Blockly.Backpack.workspace_==null) {
    return null;
  }

  /*
  if (Blockly.Block.dragMode_ == 0) {
    var blocks = Blockly.Backpack.workspace_.getTopBlocks(false);
    var MARGIN = 20;
    for (var b = 0, block; block = blocks[b]; b++) {
      var blockXY = block.getRelativeToSurfaceXY();
      var blockHW = block.getHeightWidth();
      } if (blockXY.y + blockHW.height < MARGIN) {
        // Bump any block that's above the top back inside.
        block.moveBy(0, MARGIN - blockHW.height - blockXY.y);
      }
    }
    */
  
  if(Blockly.Backpack.shouldHide){
    Blockly.Backpack.setVisible(false);
    Blockly.Backpack.shouldHide = false;
  }
};

