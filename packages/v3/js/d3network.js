(function(global) {
  let node_size_scalar,
    edge_size_scalar,
    label_size_scalar,
    nodethreshold_size_scalar,
    secondarythreshold_size_scalar,
    labelthreshold_size_scalar,
    edgethreshold_size_scalar,
    nodeSizes = [],
    edgeSizes = [],
    hiddenNodes = [],
    radius = 5,
    height = window.innerHeight,
    graphWidth =  window.innerWidth,
    graphCanvas = d3.select('#graphDiv').append('canvas')
      .attr('width', graphWidth + 'px')
      .attr('height', height + 'px')
      .attr('tabindex', '0')
      .node(),
    context = graphCanvas.getContext('2d'),
    transform = d3.zoomIdentity,
    isDrag = false,
    isPan = false,
    selectedNode = null,
    hoveredNode = null,
    resizeTicking = false,
    hoverTicking = false,
    awesompleteInput = document.querySelector('#awesomplete'),
    awesomplete = new Awesomplete(awesompleteInput),
    clickPosition = {},
    nodeDetails = document.querySelector('.node-details'),
    forceStarted = false,
    forceWasStarted = false;

  const storage = (function() {
    let uid = new Date,
      storage,
      result;
    try {
      (storage = window.localStorage).setItem(uid, uid);
      result = storage.getItem(uid) == uid;
      storage.removeItem(uid);
      return result && storage;
    } catch (exception) {}
  }());

  function d3network(data, options) {
    const weightScale = d3.scaleLinear()
      .domain(d3.extent(data.links, d => d.weight))
      .range([.1, 1]);
    let simulation = d3.forceSimulation()
      .force('center', d3.forceCenter(graphWidth / 2, height / 2))
      .force('x', d3.forceX(graphWidth / 2).strength(0.1))
      .force('y', d3.forceY(height / 2).strength(0.1))
      .force('charge', d3.forceManyBody().strength(-150))
      .force('link', d3.forceLink().strength(d => weightScale(d.weight)).id(d => d.id))
      .force('collide', d3.forceCollide().radius(d => nodeScale(d.size) + 1).iterations(1));

    const node_size_slider = document.querySelector('#node_size_slider'),
      edge_size_slider = document.querySelector('#edge_size_slider'),
      label_size_slider = document.querySelector('#label_size_slider'),
      nodethreshold_size_slider = document.querySelector('#nodethreshold_size_slider'),
      secondarythreshold_size_slider = document.querySelector('#secondarythreshold_size_slider'),
      edgethreshold_size_slider = document.querySelector('#edgethreshold_size_slider'),
      labelthreshold_size_slider = document.querySelector('#labelthreshold_size_slider'),
      labelOverlap = document.querySelector('#labelOverlap'),
      zoom_in = document.querySelector('.controls__zoom-in'),
      zoom_reset = document.querySelector('.controls__zoom-reset'),
      zoom_out = document.querySelector('.controls__zoom-out'),
      export_canvas = document.querySelector('.controls__export-canvas'),
      force_toggle = document.querySelector('#forceToggle');

    let zoomOption = options && options.zoom ? options.zoom : [1 / 10, 8],
      zoomInterval,
      adjustZoom = (increase, reset) => {
        let value = .1,
          currentZoom = transform.k;
        if (reset) {
          transform.k = 1;
          transform.x = forceWasStarted ? 0 : 0 + (graphWidth / 2);
          transform.y = forceWasStarted ? 0 : 0 + (height / 2);
        } else {
          let center = [graphWidth / 2, height / 2],
            translate0 = [(center[0] - transform.x) / transform.k, (center[1] - transform.y) / transform.k],
            l;
          transform.k += increase ? value : -value;
          transform.k = transform.k > zoomOption[1] ? zoomOption[1] : transform.k;
          transform.k = transform.k <= zoomOption[0] ? zoomOption[0] : transform.k;
          l = [translate0[0] * transform.k + transform.x, translate0[1] * transform.k + transform.y];
          transform.x += center[0] - l[0];
          transform.y += center[1] - l[1];
        }
        if (currentZoom !== transform.k || reset) {
          simulationUpdate();
        }
      },
      gettScale = () => {
        return Math.sqrt(transform.k * 1.75);
      },
      nodeScale = (size) => {
        return Math.sqrt(size / nodeSizes[nodeSizes.length - 2]) * (options && options.largestNode ? options.largestNode : 30);
      },
      edgeScale = (weight) => {
        return weight / edgeSizes[edgeSizes.length - 2] * (options && options.largestNode ? options.largestNode : 1) * (options && options.largestEdge ? options.largestEdge : .5);
      },
      zoomStart = options && options.zoomStart ? options.zoomStart : 100;

    if (node_size_slider) {
      node_size_slider.addEventListener('input', node_size_update, false);
    }

    if (edge_size_slider) {
      edge_size_slider.addEventListener('input', edge_size_update, false);
    }

    if (label_size_slider) {
      label_size_slider.addEventListener('input', label_size_update, false);
    }

    if (nodethreshold_size_slider) {
      nodethreshold_size_slider.addEventListener('input', nodethreshold_size_update, false);
    }

    if (secondarythreshold_size_slider) {
      secondarythreshold_size_slider.addEventListener('input', nodethreshold_size_update, false);
    }

    if (edgethreshold_size_slider) {
      edgethreshold_size_slider.addEventListener('input', edgethreshold_size_update, false);
    }

    if (labelthreshold_size_slider) {
      labelthreshold_size_slider.addEventListener('input', labelthreshold_size_update, false);
    }

    if (labelOverlap) {
      labelOverlap.addEventListener('change', () => {
        simulationUpdate();
      });
    }

    if (nodeDetails) {
      nodeDetails.addEventListener('click', event => {
        let nodeId = event.target.dataset.id;
        if (nodeId) {
          centerNode(nodeId);
          nodeClicked(data.nodes[nodeId]);
        }
      }, false);
    }

    if (force_toggle) {
      force_toggle.addEventListener('change', event => {
        let hasForceBeenStarted = forceWasStarted;
        if (event.target.checked) {
          data.nodes.forEach(d => {
            d.fx = null;
            d.fy = null;
          });
          forceStarted = true;
          forceWasStarted = true;
          simulation.alpha(.25).restart();
          if (!hasForceBeenStarted) {
            zoom_reset.click();
          }
        } else {
          forceStarted = false;
        }
        simulationUpdate()
      });
      if (force_toggle.checked) {
        // Use force layout if already checked
        forceStarted = true;
        forceWasStarted = true;
      } else {
        data.nodes.forEach(d => {
          d.fx = d.x;
          d.fy = d.y;
        });
      }
    } else {
      // Use force layout if no force toggle
      forceStarted = true;
      forceWasStarted = true;
    }

    if (zoom_in) {
      zoom_in.addEventListener('mousedown', zoom_handler, false);
      zoom_in.addEventListener('mouseup', zoom_handler, false);
    }

    if (zoom_reset) {
      zoom_reset.addEventListener('click', zoom_handler, false);
      // Click on load to center depending on force or not
      zoom_reset.click();
    }

    if (zoom_out) {
      zoom_out.addEventListener('mousedown', zoom_handler, false);
      zoom_out.addEventListener('mouseup', zoom_handler, false);
    }

    if (export_canvas) {
      export_canvas.addEventListener('click', () => {
        addDisclaimer().then(() => {
          let image = graphCanvas.toDataURL('image/jpeg', 1.0);
          // create temporary link
          let tmpLink = document.createElement('a');
          tmpLink.download = 'export_canvas.jpg'; // Update code to set name to network name from config
          tmpLink.href = image;

          // temporarily add link to body and initiate the download
          document.body.appendChild(tmpLink);
          tmpLink.click();
          document.body.removeChild(tmpLink);
          simulationUpdate();
        });
      }, false);
    }

    function addDisclaimer() {
      return new Promise((resolve, reject) => {
        let meta = document.querySelector('meta[name="copyright"]'),
          text = meta && meta.getAttribute('content') ? meta.getAttribute('content') : '',
          fontSize = 10,
          lineheight = 12,
          lines = text.split('\\n'),
          textY = height - lines.length * lineheight;
        if (text) {
          context.restore();
          context.font = fontSize + 'px "Helvetica Neue", "Helvetica", "Arial", sans-serif';
          context.textBaseline = 'middle';
          for (var i = 0; i < lines.length; i += 1) {
            context.fillStyle = '#fff';
            context.fillRect(Math.round((graphWidth - context.measureText(lines[i]).width) / 2), (textY - fontSize) + (i * lineheight), context.measureText(lines[i]).width, fontSize + lineheight);
          }
          for (var i = 0; i < lines.length; i += 1) {
            context.fillStyle = '#666';
            context.fillText(lines[i], Math.round((graphWidth - context.measureText(lines[i]).width) / 2), textY + (i * lineheight));
          }
          context.save();
        }
        resolve();
      });
    }

    function zoom_handler(event) {
      if (event.target === zoom_reset) {
        adjustZoom(null, true);
        return;
      }
      if (event.type === 'mousedown') {
        // Increase zoom if true is sent to adjustZoom, else decrease
        zoomInterval = setInterval(adjustZoom, 100, event.target === zoom_in ? true : false);
        adjustZoom(event.target === zoom_in ? true : false);
      } else {
        clearInterval(zoomInterval);
      }
    }

    function node_size_update(event, noUpdate) {
      let slider = document.querySelector('#node_size_slider'),
        value = slider.value;
      node_size_scalar = value / 100;
      slider.previousElementSibling.innerText = value;
      if (!noUpdate) {
        simulationUpdate();
      }
    }

    function edge_size_update(event, noUpdate) {
      let slider = document.querySelector('#edge_size_slider'),
        value = slider.value;
      edge_size_scalar = value / 100;
      slider.previousElementSibling.innerText = value;
      if (!noUpdate) {
        simulationUpdate();
      }
    }

    function label_size_update(event, noUpdate) {
      let slider = document.querySelector('#label_size_slider'),
        value = slider.value;
      label_size_scalar = value / 100;
      slider.previousElementSibling.innerText = value;
      if (!noUpdate) {
        simulationUpdate();
      }
    }

    function nodethreshold_size_update(event, noUpdate) {
      let slider = event.target;
        value = slider.value,
        shouldFilterSecondary = secondarythreshold_size_slider && secondarythreshold_size_slider.isConnected ? true : false;
      hiddenNodes = [];
      if (event.target.id === 'secondarythreshold_size_slider') {
        secondarythreshold_size_scalar = nodeSizes[value];
      } else {
        nodethreshold_size_scalar = nodeSizes[value];
      }
      slider.previousElementSibling.innerText = nodeSizes[value];
      data.nodes.forEach(d => {
        if (shouldFilterSecondary) {
          // Add normal nodes
          if (d.type !== 'secondary' && d.size < nodethreshold_size_scalar) {
            hiddenNodes.push(d.index);
          }
          // Add secondary nodes
          if ((d.type && d.type === 'secondary') && d.size < secondarythreshold_size_scalar) {
            hiddenNodes.push(d.index);
          }
        } else {
          if (d.size < nodethreshold_size_scalar) {
            hiddenNodes.push(d.index);
          }
        }
      });
      // Update selected node aside with hidden nodes
      if (selectedNode) {
        if (hiddenNodes.indexOf(selectedNode.index) > -1) {
          nodeClicked(null);
        } else {
          nodeClicked(selectedNode);
        }
        noUpdate = true;
      }
      if (!noUpdate) {
        simulationUpdate();
      }
    }

    function labelthreshold_size_update(event, noUpdate) {
      let slider = document.querySelector('#labelthreshold_size_slider'),
        value = slider.value;
      labelthreshold_size_scalar = nodeSizes[value];
      slider.previousElementSibling.innerText = nodeSizes[value];
      if (!noUpdate) {
        simulationUpdate();
      }
    }

    function edgethreshold_size_update(event, noUpdate) {
      let slider = event.target,
        value = slider.value;
      edgethreshold_size_scalar = edgeSizes[value];
      slider.previousElementSibling.innerText = edgeSizes[value];
      if (!noUpdate) {
        simulationUpdate();
      }
    }

    function min_max_node_size() {
      let nodeSliders = document.querySelectorAll('#labelthreshold_size_slider, #nodethreshold_size_slider, #secondarythreshold_size_slider'),
        edgeSliders = document.querySelectorAll('#edgethreshold_size_slider'),
        hasSecondaryType = false;

      data.nodes.forEach(function(d, i) {
        if (nodeSizes.indexOf(d.size) === -1) {
          nodeSizes.push(d.size);
        }
        if (d.type && d.type === 'secondary') {
          hasSecondaryType = true;
        }
      });

      data.links.forEach(function(d, i) {
        if (edgeSizes.indexOf(d.weight) === -1) {
          edgeSizes.push(d.weight);
        }
      });
      nodeSizes.sort((a, b) => a - b);
      nodeSizes.push(nodeSizes[nodeSizes.length - 1] + 1);
      edgeSizes.sort((a, b) => a - b);
      edgeSizes.push(edgeSizes[edgeSizes.length - 1] + 1);

      Array.prototype.forEach.call(nodeSliders, slider => {
        let defaultValue = slider.getAttribute('value') ? parseInt((nodeSizes.length - 1) * (slider.getAttribute('value') / 100)) : 0;
        slider.setAttribute('min', 0);
        slider.setAttribute('max', nodeSizes.length - 1);
        slider.value = defaultValue;
        slider.previousElementSibling.innerText = nodeSizes[defaultValue];
        if (defaultValue && slider.id !== 'labelthreshold_size_slider') {
          // Update the slider value when index values are ready
          // labelthreshold_size_slider updates separately below
          simulationUpdate(true).then(() => {
            nodethreshold_size_update({
              'target': slider
            });
          });
        }
      });
      Array.prototype.forEach.call(edgeSliders, slider => {
        let defaultValue = slider.getAttribute('value') ? parseInt((edgeSizes.length - 1) * (slider.getAttribute('value') / 100)) : 0;
        slider.setAttribute('min', 0);
        slider.setAttribute('max', edgeSizes.length - 1);
        slider.value = defaultValue;
        slider.previousElementSibling.innerText = edgeSizes[defaultValue];
        edgethreshold_size_scalar = edgeSizes[defaultValue];
      });

      // Remove Secondary threshold slider if no nodes with type 'secondary'
      if (secondarythreshold_size_slider && !hasSecondaryType) {
        secondarythreshold_size_slider.parentElement.remove();
      }
    }

    min_max_node_size();
    labelthreshold_size_update(null, true);
    edge_size_update(null, true);
    label_size_update(null, true);
    node_size_update(null, true);

    function awesompleteData() {
      let nodeArray = [];
      data.nodes.forEach((d, i) => {
        nodeArray.push({
          'label': d.label,
          'value': i
        });
      });
      return nodeArray;
    }

    function zoomed(event) {
      transform = event.transform;
      simulationUpdate();
      isPan = true;
      setTimeout(() => {
        isPan = false;
      }, 300);
    }

    d3.select(graphCanvas)
      .call(d3.drag().subject(dragsubject).on('start', dragstarted).on('drag', dragged).on('end', dragended).touchable(true))
      .call(d3.zoom().scaleExtent(zoomOption).on('zoom', zoomed).touchable(true));

    graphCanvas.addEventListener('mousemove', event => {
      if (!hoverTicking) {
        setTimeout(function() {
          hoverTicking = false;
          hoverNode(event);
        }, 100);
        hoverTicking = true;
      }
    });

    function hoverNode(event) {
      let tScale = gettScale();
      let target = simulation.find(transform.invertX(event.x), transform.invertY(event.y));

      let dx = transform.invertX(event.x) - target.x;
      let dy = transform.invertY(event.y) - target.y;
      let radius = (nodeScale(target.size) * node_size_scalar * tScale) / transform.k;

      if (dx * dx + dy * dy < radius * radius) {
        if (hoveredNode !== target) {
          hoveredNode = target;
          simulationUpdate();
        }
      } else {
        if (hoveredNode) {
          hoveredNode = null;
          simulationUpdate();
        }
      }
    }

    function nodeClicked(node) {
      let details = [],
        filterAttributes = ['name', 'label', 'p_sqrt', 'size', 'color', 'x', 'y', 'id', 'fx', 'fy', 'index', 'vy', 'vx'];
      if (node) {
        Object.keys(node).forEach(n => {
          if (filterAttributes.indexOf(n) === -1) {
            details.push(`<b>${(typeof node[n] === 'string' && node[n].includes('href=') ? '' : n + ':')}</b> ${node[n]}`);
          }
        });
      }
      nodeDetails.innerHTML = node ? `
        <h2>${node.label}</h2>
        <p>${details.join('<br><br>')}</p>
      ` : '';
      selectedNode = node;
      simulationUpdate(true).then(neighborNodes => {
        let list = neighborNodes.map(nn => {
          return `
            <li><a href="#" data-id="${nn.index}">${nn.label}</a></li>
          `
        }).join('');
        nodeDetails.innerHTML += list ? `
          <h3>Related</h3><ul>${list}</ul>
        ` : '';
        nodeDetails.scrollTop = 0;
      });
    }

    function dragsubject(event) {
      let tScale = gettScale();
      let target = simulation.find(transform.invertX(event.x), transform.invertY(event.y));

      let dx = transform.invertX(event.x) - target.x;
      let dy = transform.invertY(event.y) - target.y;
      let radius = (nodeScale(target.size) * node_size_scalar * tScale) / transform.k;

      if (dx * dx + dy * dy < radius * radius) {
        // Save original position for clicks
        clickPosition.x = target.x;
        clickPosition.y = target.y;
        target.x = transform.applyX(target.x);
        target.y = transform.applyY(target.y);
        return target;
      } else {
        if (selectedNode) {
          setTimeout(() => {
            if (!isPan) {
              nodeClicked(null);
            }
          }, 250);
        }
      }
    }

    function dragstarted(event) {
      event.subject.fx = transform.invertX(event.x);
      event.subject.fy = transform.invertY(event.y);
    }

    function dragged(event) {
      isDrag = true;
      simulation.alphaTarget(forceStarted ? 0.3 : 0).restart();
      event.subject.fx = transform.invertX(event.x);
      event.subject.fy = transform.invertY(event.y);
    }

    function dragended(event) {
      if (!isDrag) {
        // Reset original position if click only
        event.subject.x = clickPosition.x;
        event.subject.y = clickPosition.y;
        nodeClicked(event.subject === selectedNode ? null : event.subject);
      }
      isDrag = false;
      if (!event.active) {
        simulation.alphaTarget(0);
      }
      if (!forceStarted) {
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      } else {
        event.subject.fx = null;
        event.subject.fy = null;
      }
    }

    function centerNode(nodeIndex) {
      let posX = data.nodes[nodeIndex].x * transform.k - (graphWidth / 2),
        posY = data.nodes[nodeIndex].y * transform.k - (height / 2);
      transform.x = posX > 0 ? -Math.abs(posX) : Math.abs(posX);
      transform.y = posY > 0 ? -Math.abs(posY) : Math.abs(posY);
    }

    simulation.nodes(data.nodes).on('tick', simulationUpdate);

    simulation.force('link').links(data.links);

    function simulationUpdate(returnNeighbours) {
      let neighborNodes = [],
        labelArea = [],
        fontSize = 12 * label_size_scalar,
        tScale = gettScale();

      context.save();
      context.fillStyle = '#FFFFFF';
      context.fillRect(0, 0, graphWidth, height);
      //context.translate(transform.x, transform.y);
      //context.scale(transform.k, transform.k);
      context.font = `${fontSize}px "Helvetica Neue", "Helvetica", "Arial", sans-serif`;

      // Draw the edges
      data.links.forEach(d => {
        if (d.weight >= edgethreshold_size_scalar) {
          if (hiddenNodes.indexOf(d.source.index) === -1 && hiddenNodes.indexOf(d.target.index) === -1) {
            context.beginPath();
            context.moveTo(transform.applyX(d.source.x), transform.applyY(d.source.y));
            context.lineTo(transform.applyX(d.target.x), transform.applyY(d.target.y));
            context.strokeStyle = d.color;
    
            //Highlight neighborhood when user selected node.
            if (selectedNode && (selectedNode.index === d.source.index || selectedNode.index === d.target.index)) {
              let neighborhoodColor = d.color.substr(0, 7);
              context.strokeStyle = neighborhoodColor;
              context.globalAlpha = 1;
              
              if (selectedNode.index === d.target.index) {
                neighborNodes.push(d.source);
              }
              if (selectedNode.index === d.source.index) {
                neighborNodes.push(d.target);
              }
            } else if (selectedNode) {
              context.globalAlpha = .3;
            }
            if (edge_size_scalar) {
              context.lineWidth = d.weight ? (edgeScale(d.weight) / 2 * edge_size_scalar) : 5;
              context.stroke();
            }
            // Reset opacity for next iteration
            context.globalAlpha = 1;
          }
        }
      });

      function collision(rect) {
        for (let i = 0; i < labelArea.length; i++) {
          if (labelArea[i].x < rect.x + rect.w &&
              labelArea[i].x + labelArea[i].w > rect.x &&
              labelArea[i].y < rect.y + rect.h &&
              labelArea[i].h + labelArea[i].y > rect.y) {
            return true;
          }
        }

        labelArea.push(rect);
        return false;
      }

      // Draw the nodes
      data.nodes.forEach(d => {
        if (!forceStarted) {
          d.fx = d.x;
          d.fy = d.y;
        }

        //nodes
        if (hiddenNodes.indexOf(d.index) === -1) {
          context.beginPath();
          context.arc(transform.applyX(d.x), transform.applyY(d.y), (d.size ? nodeScale(d.size) : radius) * node_size_scalar * tScale, 0, 2 * Math.PI, true);
          context.fillStyle = d.color ? d.color : 'black';

          if (d === selectedNode) {
            context.beginPath();
            context.arc(transform.applyX(d.x), transform.applyY(d.y), ((d.size ? nodeScale(d.size) : radius) * node_size_scalar * tScale) - 1 * tScale, 0, 2 * Math.PI, true);
            context.strokeStyle = '#000000';
            context.lineWidth = 2 * tScale;
            context.stroke();
          }
          if (selectedNode && neighborNodes.map(n => n.index).indexOf(d.index) === -1) {
            context.globalAlpha = .3;
            context.fillStyle = 'grey';
          }
          if (d === selectedNode) {
            context.fillStyle = d.color ? d.color : 'black';
            context.globalAlpha = 1;
          }
          context.fill();
          context.globalAlpha = 1;
        }
      });

      //Adjust which labels that are shown
	  //Initial code
	  //data.nodes.slice(0).sort((a, b) => b.size - a.size).slice(0, parseInt(data.nodes.length * (zoomStart*transform.k)/100)).forEach(d => {
	  //Adjusted code: This logic hides more labels for large sets (the denominator will be 1000 for 1000 nodes, 67 for 100 nodes, 6150 for 5000 nodes) 
	  data.nodes.slice(0).sort((a, b) => b.size - a.size).slice(0, parseInt(data.nodes.length * (zoomStart*transform.k)/(data.nodes.length*Math.log(data.nodes.length)/3))).forEach(d => {
        //labels
        if (d.size >= labelthreshold_size_scalar && hiddenNodes.indexOf(d.index) === -1) {
          let textWidth = context.measureText(d.label).width;
          let lx = Math.round((transform.applyX(d.x) - textWidth / 2));
          let uy = transform.applyY(d.y) - (fontSize / 1.75) - (d.size ? nodeScale(d.size) : radius) * node_size_scalar * tScale;
          //collisions?
          if (labelOverlap && labelOverlap.checked || !collision({'x':lx, 'y':uy, 'w':textWidth, 'h':fontSize})) {
            context.fillStyle = '#111111';
            context.fillText(d.label, lx, uy);
          }
        }
      });

      if (hoveredNode && hiddenNodes.indexOf(hoveredNode.index) === -1) {
        let scaleWidth = fontSize / 5;
        let scaleHeight = fontSize + scaleWidth * 2;
        let textWidth = context.measureText(hoveredNode.label).width;
        context.fillStyle = '#000000';
        context.fillRect((transform.applyX(hoveredNode.x) - textWidth / 2) - scaleWidth, transform.applyY(hoveredNode.y) - scaleHeight - (hoveredNode.size ? nodeScale(hoveredNode.size) : radius) * node_size_scalar * tScale, textWidth + (scaleWidth * 2), fontSize);
        context.fillStyle = '#FFFFFF';
        context.fillText(hoveredNode.label, Math.round((transform.applyX(hoveredNode.x) - textWidth / 2)), transform.applyY(hoveredNode.y) - (fontSize / 1.75) - (hoveredNode.size ? nodeScale(hoveredNode.size) : radius) * node_size_scalar * tScale);
      }

      context.restore();
      if (returnNeighbours) {
        return new Promise((resolve, reject) => {
          resolve(neighborNodes.sort((a, b) => b.weight - a.weight))
        });
      }
    }

    awesomplete.list = awesompleteData();
    awesompleteInput.addEventListener('awesomplete-selectcomplete', event => {
      let nodeIndex = event.text.value;
      event.target.value = '';
      centerNode(nodeIndex);
      nodeClicked(data.nodes[nodeIndex]);
    });

    window.addEventListener('resize', () => {
      height = window.innerHeight;
      graphWidth =  window.innerWidth;
      graphCanvas.setAttribute('width', graphWidth + 'px');
      graphCanvas.setAttribute('height', height + 'px');

      if (!resizeTicking) {
        setTimeout(() => {
          simulationUpdate();
          resizeTicking = false;
        }, 250);
        resizeTicking = true;
      }
    });
  };

  // Export d3network function
  global.d3network = d3network;
})(this);
