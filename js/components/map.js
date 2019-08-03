var { LMap, LTileLayer, LMarker, LTooltip, LPopup, LLayerGroup, LControlLayers, LControl, LCircleMarker} = Vue2Leaflet;

export default {
    components: {
        LMap,
        LTileLayer,
        LPopup,
        LMarker,
        LCircleMarker, 
        Vuetify
    },
    props: ['dataUrl'],
    created() {
        this.fetchEstates();
    },
    data() { return {
        loading: true,
        showError: false,
        errorMessage: 'Error while loading weather forecast.',
        estates: [],
        info: { date: undefined },
        search: '',
        sortBy: ['net_yield'],
        sortDesc: true,
        headers: [
            { text: 'Výnosnost', value: 'net_yield', sortable: true },
            { text: 'Popis', value: 'title' },
            { text: 'Typ', value: 'type' },
            { text: 'Město', value: 'city.name' },
            { text: 'Cena', value: 'price' },
            { text: 'Stáří', value: 'timestamp' },
        ],

        zoom: 9,
        center: L.latLng(49.1871391961252, 16.5481395721436),
        url: 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png',
        attribution: '&copy; <a href="https://carto.com/attribution">CARTO</a>',
        mapOptions: {
            zoomSnap: 0.5
        },
        circleMarkerRenderer: L.canvas({padding: 0.1}),
        bounds: {
            southWest: undefined,
            northEast: undefined
        },
    };
  },
  computed: {
    filteredEstates() {
        var self = this;
        var ret = this.estates;
        if (this.bounds && this.bounds.southWest && this.bounds.northEast) {
            const southWest = self.bounds.southWest;
            const northEast = self.bounds.northEast;
            ret =  self.estates.filter(function (e) {
                return e.longitude >= southWest.x && e.latitude >= southWest.y && e.longitude <= northEast.x && e.latitude < northEast.y;
            });           
        }
        if (this.search) {
            const search = this.search.toLowerCase();
            return ret.filter(function(e) { return e.title.toLowerCase().includes(search) || e.city.name.toLowerCase().includes(search)});
        }
        return ret;
    },
  },
  methods: {  
    boundsUpdated(bounds) {
        console.log(bounds);
        if (bounds._southWest) {
        this.$set(this.bounds, 'southWest', new L.Point(bounds._southWest.lng, bounds._southWest.lat));
        this.$set(this.bounds, 'northEast', new L.Point(bounds._northEast.lng, bounds._northEast.lat));
        }
    },

    getTransformedCoordinates(lng, lat) {
        var point = new L.Point(lng, lat);
        var p = L.CRS.EPSG4326.unproject(point);
        return p;
    },
    
    getColor(d) {
        /*return d > 10 ? '#800026' : 
            d > 9  ? '#BD0026' :
            d > 8  ? '#E31A1C' :
            d > 7  ? '#FC4E2A' :
            d > 6  ? '#FD8D3C' :
            d > 5  ? '#FEB24C' :
            d > 4  ? '#FED976' :
            '#FFEDA0';*/
        return  d > 6  ? 'rgb(242, 73, 92)' :
                d > 5  ? '#FD8D3C' : 
                d > 4  ? 'rgb(249, 186, 143)' :
                'rgb(138, 184, 255)';
    },

    fetchEstates() {
        axios
        .get(this.dataUrl)
        .then((response) => {
            if (response.data.estates) {
            this.estates = response.data.estates.map(s => {
                s.latLng = this.getTransformedCoordinates(s.longitude, s.latitude);
                s.radius = 2;
                s.color = this.getColor(s.net_yield * 100);
                return s;
            });
            }
            this.info = response.data.info;
        })
        .catch((e) => {
            this.showError = true;
            this.errorMessage = `Error while loading estates: ${e.message}.`;
        })
        .finally(() => (this.loading = false));
    }
  }, 
  filters: {
    moment: function (date) {
        return moment(moment.utc(date)).format('LLL');
    },
    fromNow: function (date) {
        return moment(moment.utc(date)).fromNow();
    },
    toCurrency: function (value) {
        if (typeof value !== "number") {
          return value;
        }
        var formatter = new Intl.NumberFormat('cs-CZ', {
          style: 'currency',
          currency: 'CZK',
          minimumFractionDigits: 0
        });
        return formatter.format(value);
      },
      toPercentage: function (value, decimals = 2) {
        if (!value) value = 0
        if (!decimals) decimals = 0
      
        value = value * 100
        return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals) + '%'
      }
  },
  template: `<div>  
  <l-map :zoom="zoom"
         :center="center"
         :options="mapOptions"
         @update:bounds="boundsUpdated"
         style="height: 300px;">
    <l-tile-layer :url="url" :attribution="attribution" />
    <l-circle-marker v-for="estate in estates" :lat-lng="estate.latLng" :radius="estate.radius" :color="estate.color">
      <l-popup><a target="_blank" :href="estate.link">{{ estate.title }}</a>, {{ estate.net_yield | toPercentage }}</l-popup>
    </l-circle-marker>
  </l-map>
          
  <v-card>
    <v-card-title>            
      <v-spacer></v-spacer>
      <v-text-field
              v-model="search"
              label="Search"
              single-line
              hide-details
      ></v-text-field>
    </v-card-title>
    
    <v-data-table
      :headers="headers"
      :items="filteredEstates"
      :sort-by="sortBy"
      :sort-desc="sortDesc"
      :loading="loading"
      :items-per-page="10"
      class="elevation-1">
      <v-progress-linear v-slot:progress color="blue" indeterminate></v-progress-linear>
      <template v-slot:body="{ items }">
        <tbody>
          <tr v-for="item in items" :key="item.id">
            <td>{{ item.net_yield | toPercentage }}</td>
            <td><a target="_blank" :href="item.link">{{ item.title }}</a></td>
            <td>{{ item.type }}</td>
            <td>{{ item.city.name }}</td>
            <td>{{ item.price | toCurrency }}</td>
            <td>{{ item.timestamp | fromNow  }}</td>
          </tr>
        </tbody>        
      </template>
    </v-data-table>
    </v-card>
    </div>
    `
}
