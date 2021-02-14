(function () {
    let s, config, nodes_color, data;
    const NODE_COLOR_SELECTED = "#cc1600";
    const NODE_COLOR_NEIGHBOUR = "#dad71f";
    const NODE_COLOR_SEARCH = "#00da0a";

    function readFile(file, callback) {
        var rawFile = new XMLHttpRequest();
        let pathname = window.location.href;

        rawFile.overrideMimeType("application/json");
        rawFile.open("GET", pathname + file, true);

        rawFile.onreadystatechange = function() {
            if (rawFile.readyState === 4 && rawFile.status === 200) {
                callback(rawFile.responseText);
            }
        };

        rawFile.send(null);
    }

    function zoomReset() {
        s.camera.goTo({
            x: 0,
            y: 0,
            angle: 0,
            ratio: 1
        });
    }

    function checkNodeSelected() {
        return document.querySelector('#node_info').style.display === "block";
    }

    function checkSearchResults() {
        return document.querySelector('#search_results').style.display === 'block';
    }

    function deselectNode() {
        document.querySelector('#nodeinfo').innerHTML = '';
        document.querySelector('#node_info').style.display = 'none';

        //reset colors
        setNodesColor();

        //mark search results
        if (checkSearchResults()) {
            getNodeSearchResults();
        }
    }

    function deselectSearch() {
        var search, node_id;

        search = document.querySelector('#search');

        //reset search box
        search.value = '';
        search.focus();

        //reset search results
        document.querySelector('#search_results').style.display = 'none';
        document.querySelector('#search_node').innerHTML = '';

        //reset colors
        setNodesColor();
        if (checkNodeSelected()) {
            node_id = document.querySelector('#node_id').value;
            setNodeColor(NODE_COLOR_SELECTED, node_id);
            markNeighborhood(node_id);
        }
    }

    function setNodesColor() {
        Array.prototype.forEach.call(s.graph.nodes(), function (s_node) {
            Array.prototype.forEach.call(data.nodes, function (data_json_node) {
                if (data_json_node.id === s_node.id) {
                    if (data_json_node.color !== undefined) {
                        s_node.color = data_json_node.color;
                    } else {
                        s_node.color = nodes_color;
                    }
                }
            });
        });

        s.refresh();
    }

    function setNodeColor(nodeColor, nodeId) {
        Array.prototype.forEach.call(s.graph.nodes(), function (node) {
            if (node.id === parseInt(nodeId)) {
                node.color = nodeColor;

                return true;
            }
        });

        s.refresh();
    }

    function searchNodesClick() {
        deselectNode();
        markNeighborhood(this.dataset.id);
        setNode(this.dataset.id);
    }

    function setNodeSearch(nodeId, nodeLabel) {
        document.querySelector('#search_node').innerHTML += '<span class="search_nodes" data-id="' + nodeId + '">' + nodeLabel + '</span><br>';

        var node_info_elems = document.querySelectorAll('.search_nodes');

        Array.prototype.forEach.call(node_info_elems, function(item) {
            item.addEventListener('click', searchNodesClick, false);
        });
    }

    function getNodeSearchResults() {
        var node_id, node_info_elems;

        node_info_elems = document.querySelectorAll('.search_nodes');

        Array.prototype.forEach.call(node_info_elems, function(item) {
            node_id = item.dataset.id;
            setNodeColor(NODE_COLOR_SEARCH, node_id);
        });
    }

    function searchNodes() {
        var search_text, label, node_labels, node_ids, node_label, node_id;

        search_text = document.querySelector("#search").value;

        if (search_text === '') {
            return 0;
        }

        document.querySelector('#search_node').innerHTML = '';
        search_text = search_text.toLowerCase();

        //check for search hits
        node_labels = [];
        node_ids = [];

        Array.prototype.forEach.call(s.graph.nodes(), function(node) {
            label = node.label.toLowerCase();

            if (label.includes(search_text)) {
                node_label = node.label;
                node_id = node.id;

                node_labels.push(node_label);
                node_ids.push(node_id);
            }
        });

        //show search hits
        if (node_labels.length !== 0) {
            document.querySelector('#search_results').style.display = 'block';

            for (var i = 0; i < node_labels.length; i++) {
                setNodeSearch(node_ids[i], node_labels[i]);
                setNodeColor(NODE_COLOR_SEARCH, node_ids[i]);
            }
        }
    }

    function markNeighborhood(nodeId) {
        let db, neighborhood;

        db = new sigma.plugins.neighborhoods();

        db.load('data.json', function() {
            neighborhood = db.neighborhood(nodeId);

            Array.prototype.forEach.call(neighborhood.nodes, function(n_node) {
                Array.prototype.forEach.call(s.graph.nodes(), function(s_node) {
                    if (s_node.id === parseInt(nodeId)) {
                        s_node.color = NODE_COLOR_SELECTED;
                    } else if (n_node.id === s_node.id) {
                        s_node.color = NODE_COLOR_NEIGHBOUR;
                    }
                });
            });

            s.refresh();
        });
    }

    function setNode(nodeId) {
        document.querySelector('#node_info').style.display = "block";

        Array.prototype.forEach.call(s.graph.nodes(), function (s_node) {
            if (s_node.id === parseInt(nodeId)) {
                document.querySelector('#nodeinfo').innerHTML = '<input type="hidden" id="node_id" value="' + s_node.id + '">' + s_node.label + '<br>';

                if (s_node.attributes) {
                    for (var key in s_node.attributes) {
                        var value = s_node.attributes[key];

                        if (key !== '' && value !== '') {
                            document.querySelector('#nodeinfo').innerHTML += key + ': ' + value + '<br>';
                        }
                    }
                }

                return true;
            }
        });
    }

    function initSigma(data_parsed) {
        s = new sigma();
        s.graph.read(data_parsed);

        s.addRenderer({
            type: 'canvas',
            container: document.querySelector('#graph-container')
        });

        //settings
        s.enableHovering = !!config.settings.enableHovering;
        s.defaultLabelSize = config.settings.defaultLabelSize;
        s.minEdgeSize = config.settings.minEdgeSize;
        s.maxEdgeSize = config.settings.maxEdgeSize;
        s.minNodeSize = config.settings.minNodeSize;
        s.maxNodeSize = config.settings.maxNodeSize;
        s.zoomingRatio = config.settings.zoomingRatio;
        s.zoomMin = config.settings.zoomMin;
        s.zoomMax = config.settings.zoomMax;
        s.labelThreshold = config.settings.labelThreshold;

        //force atlas
        if (config.settings.forceAtlas2) {
            Array.prototype.forEach.call(s.graph.nodes(), function (node, i, a) {
                node.x = Math.cos(Math.PI * 2 * i / a.length);
                node.y = Math.sin(Math.PI * 2 * i / a.length);
            });

            s.startForceAtlas2({
                worker: true,
				linLogMode: true,
				adjustSizes: false,
				gravity: 1,
				strongGravityMode: true,
				edgeWeightInfluence: 1,
				outboundAttractionDistribution: true,
				barnesHutOptimize: true,
				scalingRatio: 5,
				slowDown: 10,
            });

            setTimeout(() => {
                s.stopForceAtlas2()
            }, Math.log(data_parsed.nodes.length * data_parsed.edges.length) * 500);
        }

        //node colors
        nodes_color = config.settings.nodeColor !== undefined ? config.settings.nodeColor : "#870052";
        setNodesColor();

        //node select
        s.bind('clickNode', function(e) {

            //reset colors
            setNodesColor();

            markNeighborhood(e.data.node.id);
            setNode(e.data.node.id);

            //mark search results
            if (checkSearchResults()) {
                getNodeSearchResults();
            }
        });

        //node drag
        if (config.settings.enableDraggable) {
            sigma.plugins.dragNodes(s, s.renderers[0]);
        }

        //edge type
        if (config.settings.edgeType) {
            Array.prototype.forEach.call(s.graph.edges(), function (edge) {
                edge.type = config.settings.edgeType;
            });
        }

        s.refresh();
    }

    function displayGui(config) {
        let search, search_btn;

        search = document.querySelector("#search");
        search_btn = document.querySelector("#search_btn");

        //title + text
        document.querySelector("#title").innerHTML = "<h2>" + config.text.title + "</h2>";
        document.querySelector("#titletext").innerHTML = config.text.intro;

        //event listeners
        document.querySelector("#zoom_reset").addEventListener('click', zoomReset, false);
        search_btn.addEventListener('click', searchNodes, false);
        document.querySelector("#deselect_node").addEventListener('click', deselectNode, false);
        document.querySelector("#deselect_search").addEventListener('click', deselectSearch, false);

        //search input text
        search.focus();
        search.addEventListener("keyup", function(e) {
            e.preventDefault();

            if (e.key === "Enter") {
                search_btn.click();
            }
        });
    }

    //read Config.json
    readFile("config.json", function(config_data) {
        config = JSON.parse(config_data);

        //read Data.json
        readFile("data.json", function(data_json) {
            data = JSON.parse(data_json);

            initSigma(data, config);
            displayGui(config);
        });
    })
}());