(function d3geomap() {
// The svg
  const svg = d3.select("svg")
          .attr('width', window.innerWidth)
          .attr('height', window.innerWidth / 2)
          .attr("viewBox", "0 0 " + window.innerWidth + " " + window.innerWidth / 2);
  let width = +svg.attr("width");
  let height = +svg.attr("height");

  // Map and projection
  const projection = d3.geoMercator()
      .center([0,20])                // GPS of location to zoom on
      .scale(150)                       // This is like the zoom
      .translate([ width/2, height/2 ])

  Promise.all([
    d3.json("examples/geomap/world.geojson"),
    d3.csv("examples/geomap/data_gpsLocSurfer.csv")
  ]).then(function (initialize) {
    let dataGeo = initialize[0]
    let data = initialize[1]

    // Create a color scale
    const color = d3.scaleOrdinal()
        .domain(data.map(d => d.homecontinent))
        .range(d3.schemePaired);

    // Add a scale for bubble size
    const valueExtent = d3.extent(data, d => +d.size)
    const size = d3.scaleSqrt()
        .domain(valueExtent)  // What's in the data
        .range([ 1, 50])  // Size in pixel

    // Draw the map
    svg.append("g")
        .selectAll("path")
        .data(dataGeo.features)
        .join("path")
        .attr("fill", "#b8b8b8")
        .attr("d", d3.geoPath()
            .projection(projection)
        )
        .style("stroke", "none")
        .style("opacity", .3)

    // Add circles:
    svg
        .selectAll("myCircles")
        .data(data.sort((a,b) => +b.size - +a.size).filter((d,i) => i<1000))
        .join("circle")
        .attr("cx", d => projection([+d.homelon, +d.homelat])[0])
        .attr("cy", d => projection([+d.homelon, +d.homelat])[1])
        .attr("r", d => size(+d.size))
        .style("fill", d => color(d.homecontinent))
        .attr("stroke", d=> {if (d.size>2000) {return "black"} else {return "none"}  })
        .attr("stroke-width", 1)
        .attr("fill-opacity", .4)
        .on("mouseover", function(e, d) {
          d3.selectAll('.mouseover-text').remove();
          svg
              .append("text")
              .attr("class", "mouseover-text")
              .attr("text-anchor", "end")
              .style("fill", "black")
              .attr("x", projection([+d.homelon, +d.homelat])[0])
              .attr("y", projection([+d.homelon, +d.homelat])[1])
              .html("test")
              .style("font-size", 14)
        })

    //names
    // svg
    //     .selectAll("myCircles")
    //     .data(data.filter((d,i) => d.name))
    //     .join("text")
    //     .attr("text-anchor", "end")
    //     .style("fill", "black")
    //     .attr("x", d => projection([+d.homelon, +d.homelat])[0])
    //     .attr("y", d => projection([+d.homelon, +d.homelat])[1])
    //     .html(d => d.name)
    //     .style("font-size", 14)
  })
})();
