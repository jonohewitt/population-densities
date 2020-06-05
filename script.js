const svg = d3.select("svg");

let scrollHeight = window.innerHeight * 5;

d3.select("body").style("height", `${scrollHeight}px`)

svg.attr("viewBox", "0,0,1000,600");

const worldGroup = svg.append("g");

const projection = d3
  .geoNaturalEarth1()
  .translate([500, 300])
  .scale(175);

const mapGenerator = d3.geoPath().projection(projection);

d3.json("data.json").then(data => {
  d3.json("world-110m2.json").then(mapData => {
    let maxValue = 0;
    for (let i = 0; i < data.length; i++) {
      const country = mapData.features.find(
        country => country.properties.name == data[i].name
      );
      if (data[i].density > maxValue && country) {
        maxValue = data[i].density;
      }
    }
    maxValue *= 2;

    const colorScale = d3
      .scaleSequentialPow(d3.interpolateMagma)
      .domain([maxValue, 0])
      .exponent(0.3);

    const scrollScale = d3
      .scalePow()
      .domain([0, scrollHeight])
      .range([0, maxValue])
      .exponent(3);

    worldGroup
      .selectAll("path")
      .data(mapData.features)
      .enter()
      .append("path")
      .attr("data-name", d => `${d.properties.name}`)
      .attr("d", mapGenerator)
      .style("fill", d => {
        const country = data.find(country => country.name == d.properties.name);
        return country ? colorScale(country.density) : "#111";
      });

    window.addEventListener("scroll", () => {
      const pixels = window.pageYOffset;
      const format = d3.format(".1f");

      const scrollDensityVal = format(scrollScale(pixels));

      let scrollHTML;

      if (scrollDensityVal == 0.0) {
        scrollHTML = "Showing all countries with data available";
      } else if (scrollDensityVal > maxValue / 2) {
        scrollHTML = "No remaining countries in dataset";
      } else {
        scrollHTML = `Showing countries with over ${scrollDensityVal} people per km<sup>2</sup>`;
      }

      d3.select("p.counter").html(scrollHTML);

      worldGroup.selectAll("path").style("fill", d => {
        const country = data.find(country => country.name == d.properties.name);
        return country && country.density > scrollScale(pixels)
          ? colorScale(country.density)
          : "#111";
      });
    });

    let exit = false;

    svg
      .selectAll("path")
      .on("mouseenter", function() {
        exit = false;
        const countryNameStr = `<b>Country:</b> ${this.dataset.name}`;

        const hoverCountry = data.find(
          country => country.name == this.dataset.name
        );

        const densityValue = hoverCountry
          ? hoverCountry.density + " people per km<sup>2</sup>"
          : "No data available";

        const densityStr = `<b>Population Density:</b> ${densityValue}`;
        d3.select("p.hoverCountry").html(countryNameStr);
        d3.select("p.hoverDensity").html(densityStr);
      })
      .on("mouseleave", () => {
        exit = true;
        setTimeout(() => {
          if (exit) {
            d3.select("p.hoverCountry").text(
              "Hover over a country for statistics"
            );
            d3.select("p.hoverDensity").html("");
          }
        }, 2000);
      });
  });
});
