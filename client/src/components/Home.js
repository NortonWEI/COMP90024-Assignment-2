/**
 * @author: Dafu Ai
 */

import React, {Fragment} from 'react';
import Axios from '../axios';
import {Map, TileLayer, GeoJSON, Marker, Popup} from 'react-leaflet';
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
import {
  Bar,
  BarChart, Brush,
  CartesianGrid,
  Label,
  Legend,
  ReferenceLine,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis
} from "recharts";
import {Typography} from "@material-ui/core";
import {SizeMe} from "react-sizeme";
import Divider from "@material-ui/core/Divider";
import MarkerClusterGroup from 'react-leaflet-markercluster';
import * as L from "leaflet";
import "../leaflet.awesome-markers";

class Home extends React.Component {
  state = {
      page: "",
      e: "",
      geoJSONData: null,
      loading: true,
      loadingContent: '',
      geoJSONUrl: 'http://localhost/greater-melbourne.geojson',
      bounds: null,
      sentimentData: {},
      currentFeature: null,
      allDataBySuburb: {},
      currentSuburbs: [],
      sentimentMarkers: [
      ],
  };

  async componentDidMount() {
    try {
      this.setState({
        loading: true,
        loadingContent: '(1) Suburb Data'
      });

      const suburbData = await Axios.get(
        this.state.geoJSONUrl,
      );

      let allData = {};

      this.setState({
        loadingContent: '(2) Twitter Sentiment Data'
      });

      const sentimentData = await Axios.get(
        'http://localhost:5000/tweets_sentiment/VIC',
      );

      Object.keys(sentimentData.data).forEach(s => {
        const lc = s.toLowerCase();

        if (!(lc in allData)) {
          allData[lc] = {};
        }

        allData[lc]['sent'] = sentimentData.data[s];
      });

      this.setState({
        loadingContent: '(3) Sickness Allowance Data'
      });

      const sicknessAllowanceData = await Axios.get(
        'http://localhost:5000/sickness_allowance/VIC',
      );

      Object.keys(sicknessAllowanceData.data).forEach(s => {
        const lc = s.toLowerCase();
        if (!(lc in allData)) {
          allData[lc] = {};
        }

        allData[lc]['sick'] = sicknessAllowanceData.data[s];
      });

      this.setState({
        loadingContent: '(4) Mental Health Data'
      });

      const mentalHealthData = await Axios.get(
        'http://localhost:5000/mental_health/VIC',
      );

      Object.keys(mentalHealthData.data).forEach(s => {
        const lc = s.toLowerCase();
        if (!(lc in allData)) {
          allData[lc] = {};
        }

        allData[lc]['mental'] = mentalHealthData.data[s];
      });


      this.setState({
        loadingContent: '(5) Extreme Sentiment Cases'
      });

      const sentimentPositions = await Axios.get(
        'http://localhost:5000/monitoring',
      );

      this.setState({
        geoJSONData: suburbData.data,
        allDataBySuburb: allData,
        loading: false,
        sentimentMarkers: sentimentPositions.data,
      });

      this.onMapBoundsChanged.bind(null, this)();
      console.log(allData);
    } catch (e) {
      console.log(e);
    }
  }

  hasSuburbSentiment = suburb => {
    return suburb in this.state.allDataBySuburb && 'sent' in this.state.allDataBySuburb[suburb];
  };

  getSuburbSentiment = suburb => {
    return this.state.allDataBySuburb[suburb]['sent'];
  };

  getSentimentColorBySuburb = suburb => {
    let val;
    if (!this.hasSuburbSentiment(suburb)) {
      // val = -1 + (Math.random() * 2);
      val = 0;
    } else {
      val = this.getSuburbSentiment(suburb);
    }

    return this.getSentimentColor(val)
  };

  getSentimentColor = val => {
    const red = Math.floor(Math.max(255*(-val*2), 0));
    const green = Math.floor(Math.max(255*(val*2), 0));

    return `rgb(${red},${green},0)`;
  };

  getFillOpacity = suburb => {
    if (!this.hasSuburbSentiment(suburb)) {
      return 0.5;
    }

    const val = this.getSuburbSentiment(suburb);
    return Math.max(Math.abs(val) * 0.9, 0.3);
  };

  getSuburbFromFeature = (feature) => {
    // this.state.currentFeature.properties.vic_loca_2
    return feature.id.split('~')[0].toLowerCase();
  };

  getFeatureStyle = (feature) => {
    const suburb = this.getSuburbFromFeature(feature);

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

    this.setState({currentFeature: feature});

    layer.setStyle({
        weight: 3,
        color: '#cc99ff',
        dashArray: '',
        fillOpacity: 0.7
    });

    layer.bringToFront();
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

  renderSuburbInfoPanel = (suburb) => {
    const lcSuburb = suburb.toLowerCase();
    const temp = this.state.allDataBySuburb[lcSuburb];
    const suburbData = temp ? temp : {'sent':'Unavailable', 'sick': 'Unavailable', 'mental': 'Unavailable'};

    return (
      <Paper style={{background: "rgba(255,255,255,0.8)"}} >
       <List component="nav">
          <ListItem>
            <ListItemIcon>
              <LocationOnIcon />
            </ListItemIcon>
            <ListItemText primary={suburb} />
          </ListItem>
         <ListItem>
          <ListItemIcon>
            <InsertEmoticonIcon />
          </ListItemIcon>
          <ListItemText primary={suburbData['sent']} secondary={'Twitter Sentiment'}/>
         </ListItem>
         <ListItem>
          <ListItemIcon>
            <AttachMoneyIcon />
          </ListItemIcon>
          <ListItemText primary={suburbData['sick']} secondary={'Sickness Allowance'}/>
         </ListItem>
         <ListItem>
          <ListItemIcon>
          <ShowChartIcon />
          </ListItemIcon>
          <ListItemText primary={suburbData['mental']} secondary={'Mental Health Issue Cases'}/>
         </ListItem>
      </List>
     </Paper>
    );
  };

  onMapBoundsChanged = component => {
    const mapElement = component.refs.map.leafletElement;
    const geojsonElement = component.refs.geojson.leafletElement;
    const suburbs = [];

    geojsonElement.eachLayer(layer => {
      if (mapElement.getBounds().contains(layer.getBounds().getCenter())) {
        suburbs.push(this.getSuburbFromFeature(layer.feature));
      }
    });

    this.setState({currentSuburbs: suburbs});
  };

  getSentimentIcon = sentimentPosition => {
    const sentiment = sentimentPosition.sentiment;
    let icon, color;

    if (sentiment > 0.8) {
      icon = 'grin-squint';
      color = 'green';
    } else if (sentiment >= 0.5) {
      icon = 'smile-beam';
      color = 'green';
    } else if (sentiment >= 0) {
      icon = 'smile';
      color = 'darkgreen';
    } else if (sentiment >= -0.5 && sentiment < 0) {
      icon = 'frown';
      color = 'darkred';
    } else if (sentiment >= -0.8 && sentiment < 0.5) {
      icon = 'sad-tear';
      color = 'darkred';
    } else {
      icon = 'sad-cry';
      color = 'red';
    }

    return L.AwesomeMarkers.icon({
      prefix: 'fa',
      icon: icon,
      markerColor: color,
    });
  };

  renderMap = () => {
    const position = [-37.8136, 144.9631];
    const { currentFeature, sentimentMarkers } = this.state;
    const currSuburb = currentFeature ? this.getSuburbFromFeature(currentFeature) : null;

    return (
      <Map
        center={position}
        zoom={12}
        boundOptions={this.state.bounds}
        ref="map"
        onViewportChanged={this.onMapBoundsChanged.bind(null, this)}
        maxZoom={18}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.se/hydda/full/{z}/{x}/{y}.png"
          subdomains='abcd'
          ext='png'
        />
        <MarkerClusterGroup>
          {sentimentMarkers.map(s => (
            <Marker
              position={[s.latitude, s.longitude]}
              icon={this.getSentimentIcon(s)}
            >
              <Popup>
                <span>
                  My sentiment score is {s.sentiment} <br/>
                  My sentiment fluctuation value is {s.fluctuation}
                </span>
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>
        <GeoJSON
          data={this.state.geoJSONData}
          style={this.getFeatureStyle}
          onEachFeature={this.onEachFeature.bind(null, this)}
          ref="geojson"
        />
        <Control position="topright">
          {this.state.currentFeature && this.renderSuburbInfoPanel(currSuburb)}
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
              Loading {this.state.loadingContent} ...
            </Grid>
          </Fragment>
        )}
        { !this.state.loading && this.renderMap() }
        </Grid>
    )
  };

  filterSuburbsByMapBounds = d => {
    return this.state.currentSuburbs.includes(d.suburb);
  };

  renderTopStats = () => {
    let sortedSuburbData = Object.keys(this.state.allDataBySuburb).map(s => {
      return {
        ...this.state.allDataBySuburb[s],
        suburb: s,
      }
    }).filter(this.filterSuburbsByMapBounds);


    sortedSuburbData.sort((d1, d2) => d2.sent - d1.sent);

    const positive = sortedSuburbData.filter(d => d.sent >= 0).map(d => {return {...d, sPositive: d.sent};});
    const negative = sortedSuburbData.filter(d => d.sent < 0).map(d => {return {...d, sNegative: d.sent};});
    const recombined = [...positive, ...negative];

    return (
      <Grid item xs={12} container justify="center">
        <Grid item xs={12}>
          <Typography variant="h6">Sentiment Score by Suburb</Typography>
        </Grid>
         <SizeMe>{({ size }) => <Grid item xs={12}>
            <BarChart
              width={size.width - 40}
              height={500}
              data={recombined}
              margin={{
                top: 20, right: 20, bottom: 20, left: 20,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="suburb" />
              <YAxis />
              <Tooltip />
              <Legend />
              <ReferenceLine y={0} stroke="#000" />
              <Bar dataKey="sPositive" fill="#00cc44" name="+ Avg. Twitter Sentiment"/>
              <Bar dataKey="sNegative" fill="#ff4d4d"  name="- Avg. Twitter Sentiment"/>

            </BarChart>
         </Grid>
        }
        </SizeMe>
      </Grid>

    );
  };

  renderCharts = () => {
    let sortedSuburbData = Object.keys(this.state.allDataBySuburb).map(s => {
      return {
        ...this.state.allDataBySuburb[s],
        suburb: s,
      }
    }).filter(this.filterSuburbsByMapBounds);

    sortedSuburbData.sort((d1, d2) => d2.sent - d1.sent);

    return (
      <Grid item xs={12} container justify="center">
        <Grid item xs={12}>
          <Typography variant="h6">Sentiment Score vs. Mental Health Issue Cases</Typography>
        </Grid>
        <SizeMe>{({ size }) => <Grid item xs={12} container justify="center">
          <Grid item>
            <ScatterChart
              width={size.width - 40}
              height={800}
              margin={{
                top: 20, right: 20, bottom: 20, left: 20,
              }}
            >
              <CartesianGrid />
              <XAxis type="number" dataKey="mental" name="cases" unit="">
                <Label value="Avg. Mental Health Issue Cases" offset={0} position="insideBottom" />
              </XAxis>
              <YAxis type="number" label={{ value: 'Avg. Twitter Sentiment', angle: -90, position: 'insideLeft' }} dataKey="sent" name="sentiment" unit="" />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Legend verticalAlign="bottom"/>
              {sortedSuburbData.map((d, index) => (
                  <Scatter key={index} name={`${d.suburb}`} data={[d]} fill={this.getSentimentColor(d.sent)} shape="circle" />
              ))}
            </ScatterChart>
          </Grid>
        </Grid>}</SizeMe>
        <Grid item xs={12} style={{marginTop: '30px'}}>
          <Typography variant="h6">Sentiment Score vs. Sickness Allowance</Typography>
        </Grid>
        <SizeMe>{({ size }) => <Grid item xs={12} container justify="center">
          <Grid item>
            <ScatterChart
              width={size.width - 40}
              height={800}
              margin={{
                top: 20, right: 20, bottom: 20, left: 20,
              }}
            >
              <CartesianGrid />
              <XAxis type="number" dataKey="sick" name="allowance" unit="$">
                <Label value="Avg. Sickness Allowance" offset={0} position="insideBottom" />
              </XAxis>
              <YAxis type="number" label={{ value: 'Avg. Twitter Sentiment', angle: -90, position: 'insideLeft' }} dataKey="sent" name="sentiment" unit="" />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Legend verticalAlign="bottom"/>
              {sortedSuburbData.map((d, index) => (
                  <Scatter key={index} name={`${d.suburb}`} data={[d]} fill={this.getSentimentColor(d.sent)} shape="circle" />
              ))}
            </ScatterChart>
          </Grid>
        </Grid>}</SizeMe>
      </Grid>
    )
  };

  render(){
    return (
        <Grid container spacing={24}>
          {this.renderMapSection()}
          <Grid item xs={12}>
            <Typography variant="overline">
              <b>{this.state.currentSuburbs.length}</b> Suburbs (in below charts) are matched with current map view
            </Typography>
          </Grid>
          {this.renderTopStats()}
          {this.renderCharts()}
          <Grid item xs={12}>
            <Divider style={{marginBottom: '15px'}} />
            <Typography variant="subtitle2">COMP90024 Project 2</Typography>
            <Typography variant="subtitle2">Dafu Ai, Wenzhou Wei, Jianshan Yao, Tsung Hsiu Hsieh, Zhuo Liu</Typography>
          </Grid>
        </Grid>
    );
  }
}

export default Home;
