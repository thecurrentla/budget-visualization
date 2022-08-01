<script>
  import { LayerCake, Svg } from "layercake";
  import { data } from "./data/data.json";
  import Treemap from "./Treemap.svelte";
  import Tooltip from "./Tooltip.svelte";
  import { group, InternMap } from "d3-array";
  import { format } from "d3-format";

  let hovered, root;

  function formatDollars(d) {
    return format("$0.3s")(d).replace(/G/, "B").toLowerCase();
  }

  const breadcrumbHeight = 3.25 * parseFloat(getComputedStyle(document.documentElement).fontSize);

  // If you need a list of levels:
  // const level_1 = Array.from(group(data, (d) => d["level_1"]).keys());
  // const level_2 = Array.from(group(data, (d) => d["level_2"]).keys());
  // const level_3 = Array.from(group(data, (d) => d["level_3"]).keys());
  // const levels = level_1.concat(level_2, level_3).filter((n) => n);

  // Group all the data
  let grouped = group(
    data,
    (d) => d["level_1"],
    (d) => d["level_2"],
    (d) => d["level_3"],
    (d) => d["name"]
  );

  // Promotes child items to the next level if they have no parent label, allowing the heirarchy to work with any number of levels
  function promoteChildItems(map) {
    for (let [key, value] of map) {
      if (value.constructor === InternMap) {
        promoteChildItems(value);
        if (key === "") {
          for (let [key2, value2] of value) {
            map.set(key2, value2);
          }
          map.delete(key);
        }
      }
    }
  }
  promoteChildItems(grouped);

  const dataTree = grouped;
</script>

<div class="chart-container">
  <LayerCake data={dataTree} padding={{ top: breadcrumbHeight, right: 0, bottom: 0, left: 0 }}>
    <Svg>
      <svelte:fragment slot="defs">
        <radialGradient id="white-circle" gradientTransform="translate(0.03 -0.09) scale(1.33, 1.34)">
          <stop offset="1%" stop-color="rgba(255, 255, 255, 0.28)" />
          <stop offset="11.8%" stop-color="rgba(255, 255, 255, 0.36)" />
          <stop offset="22.6%" stop-color="rgba(255, 255, 255, 0.44)" />
          <stop offset="33.4%" stop-color="rgba(255, 255, 255, 0.51)" />
          <stop offset="55%" stop-color="rgba(255, 255, 255, 0.67)" />
          <stop offset="64%" stop-color="rgba(255, 255, 255, 0.54)" />
          <stop offset="73%" stop-color="rgba(255, 255, 255, 0.41)" />
          <stop offset="82%" stop-color="rgba(255, 255, 255, 0.27)" />
          <stop offset="100%" stop-color="rgba(255, 255, 255, 0.01)" />
        </radialGradient>
      </svelte:fragment>
      <Treemap bind:hovered bind:root {formatDollars} {breadcrumbHeight} />
    </Svg>
    <Tooltip {hovered} {formatDollars} />
  </LayerCake>
</div>

<style>
  .chart-container {
    width: 100%;
    height: 100%;
  }
</style>
