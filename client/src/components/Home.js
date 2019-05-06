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
import Button from "@material-ui/core/Button";
import {Typography} from "@material-ui/core";
import {SizeMe} from "react-sizeme";

const lowerCaseKeysObject = obj => Object.fromEntries(
  Object.entries(obj).map(([k, v]) => [k.toLowerCase(), v])
);

class Home extends React.Component {
  state = {
      page: "",
      e: "",
      geoJSONData: null,
      loading: true,
      loadingContent: '',
      geoJSONUrl: 'http://localhost/geoserver.geojson',
      bounds: null,
      sentimentData: {},
      currentFeature: null,
      allDataBySuburb: {}
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
        geoJSONData: suburbData.data,
        allDataBySuburb: allData,
        loading: false,
      });

      console.log(allData);
    } catch (e) {

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
    const red = Math.floor(Math.max(255*(-val), 0));
    const green = Math.floor(Math.max(255*(val), 0));

    return `rgb(${red},${green},0)`;
  };

  getFillOpacity = suburb => {
    if (!this.hasSuburbSentiment(suburb)) {
      return 0.5;
    }

    const val = this.getSuburbSentiment(suburb);
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

  renderTopStats = () => {
    let sortedSuburbData = Object.keys(this.state.allDataBySuburb).map(s => {
      return {
        ...this.state.allDataBySuburb[s],
        suburb: s,
      }
    });

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
              height={300}
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
    // let data = [
    //   { suburb: 'MELBOURNE', x: -0.8, y: 800, z: 200 }, { suburb: 'SOUTH MELBOURNE', x: 0.5, y: 50, z: 555 },
    //   { suburb: 'SOUTHBANK', x: -0.5, y: 500, z: 170 }, { suburb: 'EAST MELBOURNE', x: 0, y: 100, z: 300 },
    //   { suburb: 'CARLTON', x: 1, y: 10, z: 1000 }, { suburb: 'DOCKLANDS', x: 0.3, y: 30, z: 333 },
    // ];
    //
    // data.sort((d1, d2) => d2.x - d1.x);

    let sortedSuburbData = Object.keys(this.state.allDataBySuburb).map(s => {
      return {
        ...this.state.allDataBySuburb[s],
        suburb: s,
      }
    });

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
              height={500}
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
              <Legend verticalAlign="bottom" height={200}/>
              {sortedSuburbData.map((d, index) => (
                  <Scatter key={index} name={`${d.suburb}`} data={[d]} fill={this.getSentimentColor(d.sent)} shape="circle" />
              ))}
            </ScatterChart>
          </Grid>
        </Grid>}</SizeMe>
        <Grid item xs={12}>
          <Typography variant="h6">Sentiment Score vs. Sickness Allowance</Typography>
        </Grid>
        <SizeMe>{({ size }) => <Grid item xs={12} container justify="center">
          <Grid item>
            <ScatterChart
              width={size.width - 40}
              height={500}
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
          {this.renderTopStats()}
          {this.renderCharts()}
        </Grid>
    );
  }
}

export default Home;
