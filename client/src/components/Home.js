import React, {Fragment} from 'react';
import Axios from '../axios';
import {Map, TileLayer, GeoJSON} from 'react-leaflet';
import {Grid} from "@material-ui/core";
import CircularProgress from '@material-ui/core/CircularProgress';
import Control from 'react-leaflet-control';
import Paper from "@material-ui/core/Paper";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import LocationOnIcon from "@material-ui/icons/LocationOn";
import AttachMoneyIcon from "@material-ui/icons/AttachMoney";
import ShowChartIcon from "@material-ui/icons/ShowChart";
import InsertEmoticonIcon from "@material-ui/icons/InsertEmoticon";
import ListItemText from "@material-ui/core/ListItemText";
import {CartesianGrid, Legend, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis} from "recharts";

const lowerCaseKeysObject = obj => Object.fromEntries(
  Object.entries(obj).map(([k, v]) => [k.toLowerCase(), v])
);

class Home extends React.Component {
  state = {
      page: "",
      e: "",
      geoJSONData: null,
      loading: true,
      //geoJSONUrl: 'https://data.gov.au/geoserver/vic-suburb-locality-boundaries-psma-administrative-boundaries/wfs?request=GetFeature&typeName=ckan_af33dd8c_0534_4e18_9245_fc64440f742e&outputFormat=json',
      geoJSONUrl: 'http://localhost/geoserver.geojson',
      bounds: null,
      sentimentData: {},
      currentFeature: null
  };

  async componentDidMount() {
    try {
      this.setState({
        loading: true
      });

      const data = await Axios.get(
        this.state.geoJSONUrl,
      );
      this.setState({
        geoJSONData: data.data,
        loading: false,
      })
    } catch (e) {

    }

    const sentimentData = {"Cambarville":-0.665,"Colac West":-0.214,"Connewarre":-0.859,"Coolaroo":-0.457,"Costerfield":-0.823,"Fitzroy North":0.274,"Fyansford":-0.469,"Garden City":0.834,"Glen Alvie":-0.747,"Glenferrie South":-0.256,"Gordon":-0.144,"Hinnomunjie":0.214,"Indigo Valley":0.134,"Joel South":0.16,"Kialla East":0.584,"Labertouche":0.293,"Lancefield":0.161,"Mount Eliza":-0.979,"Murchison North":0.515,"Narre Warren":0.816,"Neerim Junction":-0.59,"Oakleigh South":0.916,"Ormond":-0.984,"Surrey Hills":0.412,"Toongabbie":-0.042,"Tresco":-0.539,"Tynong":-0.094,"Woorarra East":-0.419,"Wyndham Vale":-0.064,"Yarrambat":0.537};

    this.setState({
      sentimentData: lowerCaseKeysObject(sentimentData)
    })
  }

  hasSuburb = suburb => {
    return suburb in this.state.sentimentData;
  };

  getSentimentColorBySuburb = suburb => {
    let val;
    if (!this.hasSuburb(suburb)) {
      // val = -1 + (Math.random() * 2);
      val = 0;
    } else {
      val = this.state.sentimentData[suburb];
    }

    return this.getSentimentColor(val)
  };

  getSentimentColor = val => {
    const red = Math.floor(Math.max(255*(-val), 0));
    const green = Math.floor(Math.max(255*(val), 0));

    const color = `rgb(${red},${green},0)`;

    //console.log(suburb + ' ' + color);
    return color;
  };

  getFillOpacity = suburb => {
    if (!this.hasSuburb(suburb)) {
      return 0.5;
    }

    const val = this.state.sentimentData[suburb];
    return Math.max(Math.abs(val) * 0.9, 0.3);
  };

  getFeatureStyle = (feature) => {
    const suburb = feature.properties.vic_loca_2.toLowerCase();

    return {
        fillColor: this.getSentimentColorBySuburb(suburb),
        weight: 2,
        opacity: 1,
        color: 'white',
        dashArray: '3',
        fillOpacity: this.getFillOpacity(suburb)
    };
  };

  highlightFeature = (e, feature) => {
    const layer = e.target;

    layer.setStyle({
        weight: 5,
        color: '#FFA500',
        dashArray: '',
        fillOpacity: 0.7
    });

    layer.bringToFront();

    this.setState({currentFeature: feature});
  };

  resetHighlight = (component, e) => {
    component.refs.geojson.leafletElement.resetStyle(e.target);
    this.setState({
      currentFeature: null
    })
  };

  zoomToFeature = (component, e) => {
    component.refs.map.leafletElement.fitBounds(e.target.getBounds());
  };

  onEachFeature = (component, feature, layer) => {
    layer.on({
        mouseover: (e) => this.highlightFeature(e, feature),
        mouseout: this.resetHighlight.bind(null, component),
        click: this.zoomToFeature.bind(null, component)
    });
  };

  renderMap = () => {
    const position = [-37.8136, 144.9631];
    const currSuburb = this.state.currentFeature ? this.state.currentFeature.properties.vic_loca_2 : null;

    return (
      <Map center={position} zoom={12} boundOptions={this.state.bounds} ref="map">
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <GeoJSON
          data={this.state.geoJSONData}
          style={this.getFeatureStyle}
          onEachFeature={this.onEachFeature.bind(null, this)}
          ref="geojson"
        />
        <Control position="topright">
          {this.state.currentFeature && (
            <Paper style={{background: "rgba(255,255,255,0.8)"}} >
             <List component="nav">
                <ListItem>
                  <ListItemIcon>
                    <LocationOnIcon />
                  </ListItemIcon>
                  <ListItemText primary={currSuburb} />
                </ListItem>
               <ListItem>
                <ListItemIcon>
                  <InsertEmoticonIcon />
                </ListItemIcon>
                <ListItemText primary={this.state.sentimentData[currSuburb.toLowerCase()]} secondary={'Twitter Sentiment'}/>
               </ListItem>
               <ListItem>
                <ListItemIcon>
                  <AttachMoneyIcon />
                </ListItemIcon>
                <ListItemText primary={'xxx'} secondary={'Sickness Allowance'}/>
               </ListItem>
               <ListItem>
                <ListItemIcon>
                <ShowChartIcon />
                </ListItemIcon>
                <ListItemText primary={'xxx'} secondary={'Mental Health Issue Cases'}/>
               </ListItem>
            </List>
           </Paper>
          )}
        </Control>
        <Control position="bottomright">
           <Paper style={{background: "rgba(255,255,255,0.8)", padding: "6px"}} >
             Sentiment Color Legend
             <Grid container alignItems="center" justify="center" style={{
               minWidth: '120px',
               height: '10px',
               marginBottom: '6px'
             }}>
               <Grid item xs style={{textAlign: "left"}}>-1</Grid>
               <Grid item xs={8}>
                 <div style={{
                   background: "linear-gradient(to right, #cc3300 0%, #009933 100%)",
                   width: '100%',
                   height: '10px'
                 }}>
                 </div>
               </Grid>
               <Grid item xs style={{textAlign: "right"}}>1</Grid>
             </Grid>

           </Paper>
        </Control>
      </Map>
    )
  };

  renderMapSection = () => {
    return (
      <Grid item xs={12} container direction="column" alignItems="center" justify="center" style={{height: '600px'}}>
        { this.state.loading && (
          <Fragment>
            <Grid item>
              <CircularProgress />
            </Grid>
            <Grid item>
              Loading map data...
            </Grid>
          </Fragment>
        )}
        { !this.state.loading && this.renderMap() }
        </Grid>
    )
  };

  renderCharts = () => {
    let data = [
      { suburb: 'MELBOURNE', x: -0.8, y: 800, z: 200 }, { suburb: 'SOUTH MELBOURNE', x: 0.5, y: 50, z: 555 },
      { suburb: 'SOUTHBANK', x: -0.5, y: 500, z: 170 }, { suburb: 'EAST MELBOURNE', x: 0, y: 100, z: 300 },
      { suburb: 'CARLTON', x: 1, y: 10, z: 1000 }, { suburb: 'DOCKLANDS', x: 0.3, y: 30, z: 333 },
    ];

    data.sort((d1, d2) => d2.x - d1.x);

    return (
      <Grid item xs={12} container justify="center">
        <Grid item>
          <ScatterChart
            width={800}
            height={400}
            margin={{
              top: 20, right: 20, bottom: 20, left: 20,
            }}
          >
            <CartesianGrid />
            <XAxis type="number" dataKey="x" name="sentiment" unit="" />
            <YAxis yAxisId="left" type="number" dataKey="y" name="cases" unit="" />
            <YAxis yAxisId="right" orientation="right" type="number" dataKey="z" name="allowance" unit="$" />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} />
            {/*<Legend />*/}
            {data.map((d, index) => (
                <Scatter yAxisId="left" key={index} name={`${d.suburb}`} data={[d]} fill={this.getSentimentColor(d.x)} shape="circle" />
            ))}
            {data.map((d, index) => (
                <Scatter yAxisId="right" key={index} name={`${d.suburb}`} data={[d]} fill={this.getSentimentColor(d.x)} shape="circle" />
            ))}
          </ScatterChart>
        </Grid>
      </Grid>
    )
  };

  render(){
    return (
        <Grid container spacing={24}>
          {this.renderMapSection()}
          {this.renderCharts()}
        </Grid>
    );
  }
}

export default Home;
