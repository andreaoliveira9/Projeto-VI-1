import { useEffect, useRef } from "react";
import * as d3 from "d3";

export const LinePlot = ({ data, width, height, margin, country }) => {
  const svgRef = useRef();

  useEffect(() => {
    if (!data || data.length === 0) return;

    // Filtra os dados para o país selecionado
    data = data.filter((d) => d.Country === country);

    // Agrupar dados por ano e calcular médias
    const parsedData = {}; // Objeto onde os dados serão armazenados
    const years = Array.from(new Set(data.map((d) => d.Year)));

    years.forEach((year) => {
      const yearData = data.filter((d) => d.Year === year);
      const avg5G = d3.mean(yearData, (d) => +d["5G Network Coverage (%)"]);
      const avgInternet = d3.mean(
        yearData,
        (d) => +d["Internet Penetration (%)"]
      );

      parsedData[year] = {
        year: new Date(year),
        avg5G: avg5G || 0,
        avgInternet: avgInternet || 0,
      };
    });

    const boundsWidth = width - margin.left - margin.right;
    const boundsHeight = height - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const xScale = d3
      .scaleTime()
      .domain(d3.extent(Object.values(parsedData), (d) => d.year))
      .range([0, boundsWidth]);

    const yScale = d3.scaleLinear().domain([0, 100]).range([boundsHeight, 0]);

    const lineGenerator5G = d3
      .line()
      .x((d) => xScale(d.year))
      .y((d) => yScale(d.avg5G));

    const lineGeneratorInternet = d3
      .line()
      .x((d) => xScale(d.year))
      .y((d) => yScale(d.avgInternet));

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const tooltip = d3
      .select("body")
      .append("div")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("background", "white")
      .style("padding", "5px")
      .style("border", "1px solid black")
      .style("border-radius", "5px")
      .style("visibility", "hidden");

    // Eixos X e Y
    const xAxis = d3.axisBottom(xScale).tickFormat(d3.timeFormat("%Y"));
    const yAxis = d3.axisLeft(yScale);

    // Grelha para eixo X
    g.append("g")
      .attr("class", "grid")
      .attr("transform", `translate(0,${boundsHeight})`)
      .call(d3.axisBottom(xScale).tickSize(-boundsHeight).tickFormat(""))
      .selectAll("line")
      .style("stroke", "#e0e0e0")
      .style("stroke-dasharray", "3,3");

    // Grelha para eixo Y
    g.append("g")
      .attr("class", "grid")
      .call(d3.axisLeft(yScale).tickSize(-boundsWidth).tickFormat(""))
      .selectAll("line")
      .style("stroke", "#e0e0e0")
      .style("stroke-dasharray", "3,3");

    // Adiciona os eixos principais
    g.append("g").attr("transform", `translate(0,${boundsHeight})`).call(xAxis);
    g.append("g").call(yAxis);

    // Linha para Cobertura 5G
    g.append("path")
      .datum(Object.values(parsedData))
      .attr("fill", "none")
      .attr("stroke", "steelblue")
      .attr("stroke-width", 1.5)
      .attr("d", lineGenerator5G);

    // Linha para Penetração de Internet
    g.append("path")
      .datum(Object.values(parsedData))
      .attr("fill", "none")
      .attr("stroke", "green")
      .attr("stroke-width", 1.5)
      .attr("d", lineGeneratorInternet);

    // Pontos para Cobertura 5G
    g.selectAll(".dot5G")
      .data(Object.values(parsedData))
      .enter()
      .append("circle")
      .attr("cx", (d) => xScale(d.year))
      .attr("cy", (d) => yScale(d.avg5G))
      .attr("r", 4)
      .style("fill", "steelblue")
      .on("mouseover", function (event, d) {
        tooltip
          .html(
            `<strong>5G Coverage:</strong> ${d.avg5G.toFixed(
              2
            )}%<br><strong>Year:</strong> ${d3.timeFormat("%Y")(d.year)}`
          )
          .style("visibility", "visible");
      })
      .on("mousemove", function (event) {
        tooltip
          .style("top", `${event.pageY - 10}px`)
          .style("left", `${event.pageX + 10}px`);
      })
      .on("mouseout", function () {
        tooltip.style("visibility", "hidden");
      });

    // Pontos para Penetração de Internet
    g.selectAll(".dotInternet")
      .data(Object.values(parsedData))
      .enter()
      .append("circle")
      .attr("cx", (d) => xScale(d.year))
      .attr("cy", (d) => yScale(d.avgInternet))
      .attr("r", 4)
      .style("fill", "green")
      .on("mouseover", function (event, d) {
        tooltip
          .html(
            `<strong>Internet Penetration:</strong> ${d.avgInternet.toFixed(
              2
            )}%<br><strong>Year:</strong> ${d3.timeFormat("%Y")(d.year)}`
          )
          .style("visibility", "visible");
      })
      .on("mousemove", function (event) {
        tooltip
          .style("top", `${event.pageY - 10}px`)
          .style("left", `${event.pageX + 10}px`);
      })
      .on("mouseout", function () {
        tooltip.style("visibility", "hidden");
      });

    // Labels
    g.append("text")
      .attr(
        "transform",
        `translate(${boundsWidth / 2},${boundsHeight + margin.bottom})`
      )
      .style("text-anchor", "middle")
      .text("Year");

    g.append("text")
      .attr("transform", `translate(-40,${boundsHeight / 2}) rotate(-90)`)
      .style("text-anchor", "middle")
      .text("Percentage (%)");

    // Add the legend for 5G Network Coverage
    g.append("circle")
      .attr("cx", boundsWidth - 110)
      .attr("cy", boundsHeight - 270)
      .attr("r", 6)
      .style("fill", "steelblue");

    g.append("text")
      .attr("x", boundsWidth - 102)
      .attr("y", boundsHeight - 270)
      .attr("dy", ".35em")
      .text("5G Coverage (%)");

    // Add the legend for Internet Penetration
    g.append("circle")
      .attr("cx", boundsWidth - 148)
      .attr("cy", boundsHeight - 295)
      .attr("r", 6)
      .style("fill", "green");

    g.append("text")
      .attr("x", boundsWidth - 140)
      .attr("y", boundsHeight - 295)
      .attr("dy", ".35em")
      .text("Internet Penetration (%)");
  }, [data, width, height, margin, country]);

  return <svg ref={svgRef} width={width} height={height}></svg>;
};