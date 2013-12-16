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
Blockly.Backpack.workspaceWidth_ = 300;

/**
 * Height of workspace.
 * @private
 */
Blockly.Backpack.workspaceHeight_ = 100;

Blockly.Backpack.isVisible = false;

Blockly.Backpack.shouldHide = false;

Blockly.Backpack.hasScrollbars = true;  

Blockly.Backpack.isOver = false;

Blockly.Backpack.getMetrics = function() {

  var viewWidth = Blockly.Backpack.workspaceWidth_ - Blockly.Scrollbar.scrollbarThickness;
  var viewHeight = Blockly.Backpack.workspaceHeight_ - Blockly.Scrollbar.scrollbarThickness;
  try {
    var blockBox = Blockly.Backpack.workspace_.getCanvas().getBBox();
  } catch (e) {
    // Firefox has trouble with hidden elements (Bug 528969).
    return null;
  }
  if (Blockly.Backpack.workspace_.scrollbar) {
    // Add a border around the content that is at least half a screenful wide.
    var leftEdge = Math.min(blockBox.x - viewWidth / 2,
                            blockBox.x + blockBox.width - viewWidth);
    var rightEdge = Math.max(blockBox.x + blockBox.width + viewWidth / 2,
                             blockBox.x + viewWidth);
    var topEdge = Math.min(blockBox.y - viewHeight / 2,
                           blockBox.y + blockBox.height - viewHeight);
    var bottomEdge = Math.max(blockBox.y + blockBox.height + viewHeight / 2, blockBox.y + viewHeight);
  } else {
    var leftEdge = blockBox.x;
    var rightEdge = leftEdge + blockBox.width;
    var topEdge = blockBox.y;
    var bottomEdge = topEdge + blockBox.height;
  }
  //We don't use Blockly.Toolbox in our version of Blockly instead we use drawer.js
  //var absoluteLeft = Blockly.RTL ? 0 : Blockly.Toolbox.width;
  var absoluteLeft = Blockly.RTL ? 0 : 0;
  return {
    viewHeight: Blockly.Backpack.workspaceHeight_,
    viewWidth: Blockly.Backpack.workspaceWidth_,
    contentHeight: bottomEdge - topEdge,
    contentWidth: rightEdge - leftEdge,
    viewTop: -Blockly.Backpack.workspace_.scrollY,
    viewLeft: -Blockly.Backpack.workspace_.scrollX,
    contentTop: topEdge,
    contentLeft: leftEdge,
    absoluteTop: 0,
    absoluteLeft: absoluteLeft
  };
}

Blockly.Backpack.setMetrics = function(xyRatio) {
  if (!Blockly.Backpack.workspace_.scrollbar) {
    throw 'Attempt to set main workspace scroll without scrollbars.';
  }
  var metrics = Blockly.Backpack.getMetrics();
  if (goog.isNumber(xyRatio.x)) {
    Blockly.Backpack.workspace_.scrollX = -metrics.contentWidth * xyRatio.x -
        metrics.contentLeft;
  }
  if (goog.isNumber(xyRatio.y)) {
    Blockly.Backpack.workspace_.scrollY = -metrics.contentHeight * xyRatio.y -
        metrics.contentTop;
  }
  var translation = 'translate(' +
      (Blockly.Backpack.workspace_.scrollX + metrics.absoluteLeft) + ',' +
      (Blockly.Backpack.workspace_.scrollY + metrics.absoluteTop) + ')';
  Blockly.Backpack.workspace_.getCanvas().setAttribute('transform', translation);
  Blockly.Backpack.workspace_.getBubbleCanvas().setAttribute('transform',
                                                       translation);
};


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
      Blockly.Backpack.getMetrics, Blockly.Backpack.setMetrics)
  Blockly.Backpack.workspace_.dragMode = false;
  Blockly.Backpack.svgDialog_.appendChild(Blockly.Backpack.workspace_.createDom());


  if (Blockly.Backpack.hasScrollbars){ 
      Blockly.Backpack.workspace_.scrollbar = new Blockly.ScrollbarPair(
         Blockly.Backpack.workspace_);
      Blockly.Backpack.workspace_.scrollbar.resize();
  }
    
  Blockly.Backpack.workspace_.addTrashcan();

  // [lyn, 12/10/13] Let's make the backpack workspace nonempty by adding some blocks
  var xmlString = '<xml>' +
      '<block type="controls_forRange">' +
      '<value name="START">' +
      '<block type="math_add" inline="true">' +
      '<mutation items="2"></mutation>' +
      '<value name="NUM0"><block type="math_number"><title name="NUM">1</title></block></value>' +
      '<value name="NUM1"><block type="text"><title name="TEXT">a</title></block></value>' +
      '</block></value>' +
      '<value name="END"><block type="math_number"><title name="NUM">5</title></block></value>' +
      '<value name="STEP"><block type="math_number"><title name="NUM">1</title></block></value>' +
      '</block>' +
      '</xml>';
  var dom = Blockly.Xml.textToDom(xmlString);
  Blockly.Xml.domToWorkspace(Blockly.Backpack.workspace_, dom);


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
    // [lyn, 12/10/13] Some code that makes a bubble of a particular size.
    //Blockly.Backpack.workspace_.topBlocks_[0].render();
    Blockly.Backpack.workspace_.render();

    var doubleBorderWidth = 2 * Blockly.BackpackBubble.BORDER_WIDTH;

    try {
      var workspaceSize = Blockly.Backpack.workspace_.getCanvas().getBBox();
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
    var height = workspaceSize.height + doubleBorderWidth * 3
                          
    width += doubleBorderWidth * 3;
    // Only resize if the size difference is significant.  Eliminates shuddering.
    if (Math.abs(Blockly.Backpack.workspaceWidth_ - width) > doubleBorderWidth ||
        Math.abs(Blockly.Backpack.workspaceHeight_ - height) > doubleBorderWidth) {
      // Record some layout information for getFlyoutMetrics_.
      Blockly.Backpack.workspaceWidth_ = width;
      Blockly.Backpack.workspaceHeight_ = height;
      Blockly.Backpack.workspace_.viewWidth = width;
      Blockly.Backpack.workspace_.viewHeight = height;
      Blockly.Backpack.workspace_.scrollbar.resize();
      // Resize the bubble.
      Blockly.Backpack.bubble_.setBubbleSize(width + doubleBorderWidth,
                                 height + doubleBorderWidth);
      Blockly.Backpack.svgDialog_.setAttribute('width', Blockly.Backpack.workspaceWidth_);
      Blockly.Backpack.svgDialog_.setAttribute('height', Blockly.Backpack.workspaceHeight_);
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
        Blockly.Backpack.createEditor_(), (Blockly.getMainWorkspaceMetrics_().viewWidth - 50), 200);

    // [lyn, 12/10/13] Color string needs to begin with #
    Blockly.Backpack.bubble_.setColour("#00ff00")
   
    
    // [lyn, 12/10/13] Need to uncomment this line
    Blockly.Backpack.resizeBubble_();
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


Blockly.Backpack.addToBackpack = function(block) {
  var dom = Blockly.Xml.blockToDom_(block);
  var bl = Blockly.Xml.domToBlock_(Blockly.Backpack.workspace_, dom);
  bl.moveBy(0,0)
  bl.isInBackpack = true;
}

Blockly.Backpack.copyToWorkspace = function(block){
  var dom = Blockly.Xml.blockToDom_(block);
  var bl = Blockly.Xml.domToBlock_(Blockly.mainWorkspace, dom);
  bl.moveBy(0,0)
  bl.isInBackpack = false;
}

//mouse callbacks

/**
 * Obtains starting coordinates so the block can return to spot after copy
 * @param {!Event} e Mouse down event.
 */
Blockly.Backpack.onMouseDown = function(e){
  
  Blockly.Backpack.workspace_.dragMode = true;
  // Record the current mouse position.
  Blockly.Backpack.workspace_.startDragMouseX = e.clientX;
  Blockly.Backpack.workspace_.startDragMouseY = e.clientY;
  Blockly.Backpack.workspace_.startDragMetrics = Blockly.Backpack.workspace_.getMetrics();
  Blockly.Backpack.workspace_.startScrollX = Blockly.Backpack.workspace_.scrollX;
  Blockly.Backpack.workspace_.startScrollY = Blockly.Backpack.workspace_.scrollY;
  
}

/**
 * When block is let go over the backpack, copy it and return to original position
 * @param {!Event} e Mouse up event
 */
Blockly.Backpack.onMouseUp = function(e, startX, startY, block, inBackpack){

  if (!inBackpack) {
    Blockly.Backpack.addToBackpack(block);
  } else {
    Blockly.Backpack.copyToWorkspace(block)
  }
  var xy = Blockly.getAbsoluteXY_(Blockly.Backpack.bubble_.bubbleGroup_);
  var mouseX = e.clientX //xy.x;
  var mouseY = e.clientY //xy.y;
  Blockly.selected.moveBy((startX - e.clientX), (startY - e.clientY));
 
   
}
/**
 * Determines if the mouse (with a block) is currently over the backpack.
 * Opens/closes the lid and sets the isLarge flag.
 * @param {!Event} e Mouse move event.
 */
Blockly.Backpack.onMouseMove = function(e) {
  /*
  An alternative approach would be to use onMouseOver and onMouseOut events.
  However the selected block will be between the mouse and the backpack,
  thus these events won't fire.
  Another approach is to use HTML5's drag & drop API, but it's widely hated.
  Instead, we'll just have the block's drag_ function call us.
  */

  var mouseXY = Blockly.mouseToSvg(e);
  var backpackXY = Blockly.getSvgXY_(Blockly.Backpack.bubble_.bubbleGroup_);
  Blockly.Backpack.isOver = (mouseXY.x > backpackXY.x) &&
             (mouseXY.x < backpackXY.x + Blockly.Backpack.workspaceWidth_) &&
             (mouseXY.y > backpackXY.y) &&
             (mouseXY.y < backpackXY.y + Blockly.Backpack.workspaceHeight_);
  //Blockly.Backpack.isOver = true;

  if (Blockly.Backpack.workspace_.dragMode) {
    Blockly.removeAllRanges();
    var dx = e.clientX - Blockly.Backpack.workspace_.startDragMouseX;
    var dy = e.clientY - Blockly.Backpack.workspace_.startDragMouseY;
    var metrics = Blockly.Backpack.workspace_.startDragMetrics;
    var x = Blockly.Backpack.workspace_.startScrollX + dx;
    var y = Blockly.Backpack.workspace_.startScrollY + dy;
    x = Math.min(x, -metrics.contentLeft);
    y = Math.min(y, -metrics.contentTop);
    x = Math.max(x, metrics.viewWidth - metrics.contentLeft -
                 metrics.contentWidth);
    y = Math.max(y, metrics.viewHeight - metrics.contentTop -
                 metrics.contentHeight);

    // Move the scrollbars and the page will scroll automatically.
    Blockly.Backpack.workspace_.scrollbar.set(-x - metrics.contentLeft,
                                              -y - metrics.contentTop);
  }
}

  /*

  if (!this.svgGroup_) {
    return;
  }
  var xy = Blockly.getAbsoluteXY_(this.svgGroup_);
  var left = xy.x;
  var top = xy.y;

  // Convert the mouse coordinates into SVG coordinates.
  xy = Blockly.convertCoordinates(e.clientX, e.clientY, true);
  var mouseX = xy.x;
  var mouseY = xy.y;

  var over = (mouseX > left) &&
             (mouseX < left + this.WIDTH_) &&
             (mouseY > top) &&
             (mouseY < top + this.BODY_HEIGHT_);
  if (this.isOpen != over) {
     this.setOpen_(over);
  }
};


Blockly.Backpack.mouseIsOver = function(e) {
  xy = Blockly.convertCoordinates(e.clientX, e.clientY, true);
  var mouseX = xy.x;
  var mouseY = xy.y;
  var over = (mouseX > this.left_) &&
               (mouseX < this.left_ + this.WIDTH_) &&
               (mouseY > this.top_) &&
               (mouseY < this.top_ + this.BODY_HEIGHT_);
  this.isOver = over;
  return over;
};

*/
