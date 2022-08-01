<script>
  import { LayerCake, Svg } from "layercake";
  import { data } from "./data/data.json";
  import { descriptions } from "./data/data.json";
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

  console.log(grouped);

  // Adds descriptions into data
  function addMetadata(map) {
    for (let [key, value] of map) {
      console.log(key);
      console.log(value);
      if (value.constructor === InternMap) {
        addMetadata(value);
        if (key === "") {
        }
      }
    }
  }
  // addMetadata(grouped);

  const dataTree = grouped;
</script>

<div class="chart-container">
  <LayerCake data={dataTree} padding={{ top: breadcrumbHeight, right: 0, bottom: 0, left: 0 }}>
    <Svg>
      <!-- <svelte:fragment slot="defs">
        <radialGradient id="circle-gray" gradientTransform="translate(-0.25 -0.25) scale(2, 2)">
          <stop offset="2%" stop-color="rgba(255, 255, 255, 0.1)" />
          <stop offset="30%" stop-color="#ff0000" />
          <stop offset="60%" stop-color="#ff0000" />
          <stop offset="98%" stop-color="rgba(0, 0, 0, 0.1)" />
        </radialGradient>
        <radialGradient id="circle-teal" gradientTransform="translate(-0.25 -0.25) scale(2, 2)">
          <stop offset="2%" stop-color="rgba(255, 255, 255, 0.1)" />
          <stop offset="30%" stop-color="#6bbaca" />
          <stop offset="60%" stop-color="#6bbaca" />
          <stop offset="98%" stop-color="rgba(0, 0, 0, 0.1)" />
        </radialGradient>
        <radialGradient id="circle-blue" gradientTransform="translate(-0.25 -0.25) scale(2, 2)">
          <stop offset="2%" stop-color="rgba(255, 255, 255, 0.1)" />
          <stop offset="30%" stop-color="#4dbfdf" />
          <stop offset="60%" stop-color="#4dbfdf" />
          <stop offset="98%" stop-color="rgba(0, 0, 0, 0.1)" />
        </radialGradient>
        <radialGradient id="circle-green" gradientTransform="translate(-0.25 -0.25) scale(2, 2)">
          <stop offset="2%" stop-color="rgba(255, 255, 255, 0.1)" />
          <stop offset="30%" stop-color="#79a240" />
          <stop offset="60%" stop-color="#79a240" />
          <stop offset="98%" stop-color="rgba(0, 0, 0, 0.1)" />
        </radialGradient>
        <radialGradient id="circle-yellow" gradientTransform="translate(-0.25 -0.25) scale(2, 2)">
          <stop offset="2%" stop-color="rgba(255, 255, 255, 0.1)" />
          <stop offset="30%" stop-color="#f8de00" />
          <stop offset="60%" stop-color="#f8de00" />
          <stop offset="98%" stop-color="rgba(0, 0, 0, 0.1)" />
        </radialGradient>
        <radialGradient id="circle-red" gradientTransform="translate(-0.25 -0.25) scale(2, 2)">
          <stop offset="2%" stop-color="rgba(255, 255, 255, 0.1)" />
          <stop offset="30%" stop-color="#f27558" />
          <stop offset="60%" stop-color="#f27558" />
          <stop offset="98%" stop-color="rgba(0, 0, 0, 0.1)" />
        </radialGradient>
        <radialGradient id="circle-purple" gradientTransform="translate(-0.25 -0.25) scale(2, 2)">
          <stop offset="2%" stop-color="rgba(255, 255, 255, 0.1)" />
          <stop offset="30%" stop-color="#838bc5" />
          <stop offset="60%" stop-color="#838bc5" />
          <stop offset="98%" stop-color="rgba(0, 0, 0, 0.1)" />
        </radialGradient>
      </svelte:fragment> -->
      <Treemap bind:hovered bind:root {formatDollars} {breadcrumbHeight} />
    </Svg>
    <!-- <Tooltip {hovered} {formatDollars} /> -->
  </LayerCake>
</div>

<style>
  .chart-container {
    width: 100%;
    height: 100%;
  }
</style>
