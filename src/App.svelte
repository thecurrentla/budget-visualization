<script>
  import { LayerCake, Svg } from "layercake";

  import Treemap from "./Treemap.svelte";
  // import Tooltip from "./Tooltip.svelte";
  // import Breadcrumb from "./Breadcrumb.svelte";

  import data from "./data/2022-data.json";

  import { group, InternMap } from "d3-array";
  import { format } from "d3-format";

  let breadcrumb, root;

  function formatDollars(d) {
    return format("$0.3s")(d).replace(/G/, "B").toLowerCase();
  }

  const breadcrumbHeight = 3.25 * parseFloat(getComputedStyle(document.documentElement).fontSize);

  // Group all the data
  let grouped = group(
    Object.values(data),
    (d) => d["level_1"],
    (d) => d["level_2"],
    (d) => d["level_3"],
    (d) => d["name"]
  );
  // console.log(grouped);

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
  // console.log(grouped);

  const dataTree = grouped;
</script>

<LayerCake data={dataTree} padding={{ top: breadcrumbHeight, right: 0, bottom: 0, left: 0 }} ssr={true}>
  <!-- <Breadcrumb {breadcrumb} /> -->
  <Svg>
    <svelte:fragment slot="defs">
      <linearGradient id="white-small" gradientTransform="rotate(60)">
        <stop offset="0%" stop-color="rgba(255, 255, 255, 0.5)" />
        <stop offset="33%" stop-color="rgba(255, 255, 255, 0.3)" />
        <stop offset="100%" stop-color="rgba(255, 255, 255, 0)" />
      </linearGradient>
      <linearGradient id="white-large" gradientTransform="rotate(30)">
        <stop offset="0%" stop-color="rgba(255, 255, 255, 0.45)" />
        <stop offset="66%" stop-color="rgba(255, 255, 255, 0.3)" />
        <stop offset="100%" stop-color="rgba(255, 255, 255, 0.15)" />
      </linearGradient>
      <g id="icon-arrow-up-left-circle">
        <path
          fill="currentColor"
          fill-rule="evenodd"
          d="M1 8a7 7 0 1 0 14 0A7 7 0 0 0 1 8zm15 0A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-5.904 2.803a.5.5 0 1 0 .707-.707L6.707 6h2.768a.5.5 0 1 0 0-1H5.5a.5.5 0 0 0-.5.5v3.975a.5.5 0 0 0 1 0V6.707l4.096 4.096z"
        />
      </g>
      <g id="icon-arrows-angle-expand">
        <path
          fill="currentColor"
          fill-rule="evenodd"
          d="M5.828 10.172a.5.5 0 0 0-.707 0l-4.096 4.096V11.5a.5.5 0 0 0-1 0v3.975a.5.5 0 0 0 .5.5H4.5a.5.5 0 0 0 0-1H1.732l4.096-4.096a.5.5 0 0 0 0-.707zm4.344-4.344a.5.5 0 0 0 .707 0l4.096-4.096V4.5a.5.5 0 1 0 1 0V.525a.5.5 0 0 0-.5-.5H11.5a.5.5 0 0 0 0 1h2.768l-4.096 4.096a.5.5 0 0 0 0 .707z"
        />
      </g>
      <g id="icon-file-earmark-pdf">
        <path
          fill="currentColor"
          d="M14 14V4.5L9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2zM9.5 3A1.5 1.5 0 0 0 11 4.5h2V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h5.5v2z"
        />
        <path
          fill="currentColor"
          d="M4.603 14.087a.81.81 0 0 1-.438-.42c-.195-.388-.13-.776.08-1.102.198-.307.526-.568.897-.787a7.68 7.68 0 0 1 1.482-.645 19.697 19.697 0 0 0 1.062-2.227 7.269 7.269 0 0 1-.43-1.295c-.086-.4-.119-.796-.046-1.136.075-.354.274-.672.65-.823.192-.077.4-.12.602-.077a.7.7 0 0 1 .477.365c.088.164.12.356.127.538.007.188-.012.396-.047.614-.084.51-.27 1.134-.52 1.794a10.954 10.954 0 0 0 .98 1.686 5.753 5.753 0 0 1 1.334.05c.364.066.734.195.96.465.12.144.193.32.2.518.007.192-.047.382-.138.563a1.04 1.04 0 0 1-.354.416.856.856 0 0 1-.51.138c-.331-.014-.654-.196-.933-.417a5.712 5.712 0 0 1-.911-.95 11.651 11.651 0 0 0-1.997.406 11.307 11.307 0 0 1-1.02 1.51c-.292.35-.609.656-.927.787a.793.793 0 0 1-.58.029zm1.379-1.901c-.166.076-.32.156-.459.238-.328.194-.541.383-.647.547-.094.145-.096.25-.04.361.01.022.02.036.026.044a.266.266 0 0 0 .035-.012c.137-.056.355-.235.635-.572a8.18 8.18 0 0 0 .45-.606zm1.64-1.33a12.71 12.71 0 0 1 1.01-.193 11.744 11.744 0 0 1-.51-.858 20.801 20.801 0 0 1-.5 1.05zm2.446.45c.15.163.296.3.435.41.24.19.407.253.498.256a.107.107 0 0 0 .07-.015.307.307 0 0 0 .094-.125.436.436 0 0 0 .059-.2.095.095 0 0 0-.026-.063c-.052-.062-.2-.152-.518-.209a3.876 3.876 0 0 0-.612-.053zM8.078 7.8a6.7 6.7 0 0 0 .2-.828c.031-.188.043-.343.038-.465a.613.613 0 0 0-.032-.198.517.517 0 0 0-.145.04c-.087.035-.158.106-.196.283-.04.192-.03.469.046.822.024.111.054.227.09.346z"
        />
      </g>
      <g id="icon-box-arrow-up-right">
        <path
          fill="currentColor"
          fill-rule="evenodd"
          d="M8.636 3.5a.5.5 0 0 0-.5-.5H1.5A1.5 1.5 0 0 0 0 4.5v10A1.5 1.5 0 0 0 1.5 16h10a1.5 1.5 0 0 0 1.5-1.5V7.864a.5.5 0 0 0-1 0V14.5a.5.5 0 0 1-.5.5h-10a.5.5 0 0 1-.5-.5v-10a.5.5 0 0 1 .5-.5h6.636a.5.5 0 0 0 .5-.5z"
        />
        <path
          fill="currentColor"
          fill-rule="evenodd"
          d="M16 .5a.5.5 0 0 0-.5-.5h-5a.5.5 0 0 0 0 1h3.793L6.146 9.146a.5.5 0 1 0 .708.708L15 1.707V5.5a.5.5 0 0 0 1 0v-5z"
        />
      </g>
    </svelte:fragment>
    <Treemap bind:breadcrumb bind:root {formatDollars} {breadcrumbHeight} />
  </Svg>
  <!-- <Tooltip {hovered} {formatDollars} /> -->
</LayerCake>
