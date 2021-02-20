import React, { Component, useState, useCallback, useRef } from 'react';
import { Text, View, TextInput, Button, Alert } from 'react-native';
import socketIOClient from "socket.io-client";
import YoutubePlayer from 'react-native-youtube-iframe';

const ENDPOINT = "http://192.168.31.239:3000";

const extract_video_id = (url) => {
    if(!url){
        return "iee2TATGMyI"
    }
    console.log(url);
    var video_id = url.split('v=')[1]
    var ampersandPosition = video_id.indexOf('&');
    if(ampersandPosition != -1) {
        video_id = video_id.substring(0, ampersandPosition);
    }
    console.log(video_id)
    return video_id;
}

const UserLogin = (props) => {
    return (
        <View style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center"
        }}>
            <Text style={{
                justifyContent:"center"
            }}>
                Username
            </Text>
            <TextInput
                style={{height: 40, borderWidth: 1, width:250}}
                onChangeText={text => props.updateState({username:text})}
            />
            <Text style={{
                justifyContent:"center"
            }}>
                Room number
            </Text>
            <TextInput
                style={{height: 40, borderWidth: 1, width:250}}
                onChangeText={text => props.updateState({room:text})}
            />
            <Button style = {{flex: 1}}
                    title="Submit" disabled={props.disabledButton()} onPress={()=>props.onSubmit()}/>
        </View>
    );
}

const URLPage = (props) => {
    return (
        <View style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center"
        }}>
        <Text style={{
            justifyContent:"center"
        }}>
            URL
        </Text>
        <TextInput
            style={{height: 40, borderWidth: 1, width:250}}
            onChangeText={text => props.updateState({url:text})}
        />
        <Button style = {{flex: 1}}
                title="Submit" onPress={()=>props.onSubmit()}/>
        </View>
    )
}
 class LoginPage extends Component {
  
  constructor(props){
      super(props);
      this.state = {
        username: '',
        room:'',
        url:'',
        login_submitted:false,
          room_exist:false
      }
      this.props.socket.on("")
      // const socket = socketIOClient(ENDPOINT);
  }

  updateState = (data) => {
      this.setState(data)
  }

  onSubmitLogin = () => {

      this.props.socket.emit("new user", this.state.username, (data) => {
          console.log(data);
      });
      this.props.socket.emit("room exist", {
          roomnum: this.state.room
      }, (exist) => {
          console.log("room exist?: ", exist);
          if(exist){
              this.props.socket.emit("new room", {
                  roomnum: this.state.room
              });
              this.props.onSubmit(this.state.username, this.state.room, '');
          }
          this.setState({
              room_exist: exist,
              login_submitted: true
          });
      });

  }

  onSubmitUrl = () => {
      this.props.socket.emit("new room", {
          roomnum: this.state.room,
          video_id: extract_video_id(this.state.url)
      });
      this.props.onSubmit(this.state.username, this.state.room, this.state.url);
  }

  disabledButton = () => {
      return !this.state.username || !this.state.room;
  }

  render() {  
    return (
      <View style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center"
        }}>
          {!this.state.login_submitted && <UserLogin updateState={this.updateState} onSubmit={this.onSubmitLogin} disabledButton={this.disabledButton}/>}
          {this.state.login_submitted && !this.state.room_exist && <URLPage updateState={this.updateState} onSubmit={this.onSubmitUrl}/>}
        {/*<Button style = {{flex: 1}}*/}
        {/*  title="Submit" disabled={!this.state.username || !this.state.room} onPress={()=>this.props.onSubmit(this.state.username, this.state.room, this.state.url)}/>*/}
      </View>
    );
  }
}

class VideoPage extends Component {
    constructor(props) {
        super(props);
        this.state = {
            prev: false
        }
    }
    togglePlaying = () => {
        this.setState((prevState, p) => {
            return {
                prev: !prevState.prev
            }
        })
    }
    render(){
        console.log("videoId: ", this.props.videoId)
        return(
            <View style={{
                flex: 1,
                justifyContent:"center",
                alignItems:"center"
            }}>
                <YoutubePlayer
                    height={300}
                    width={400}
                    play={this.state.prev}
                    videoId={this.props.videoId}
                />
                <Button title={this.state.prev ? "pause" : "play"} onPress={this.togglePlaying} />
            </View>
        );
    }
}

class HackScApp extends Component{
  constructor(props){
    super(props);
    this.socket = socketIOClient(ENDPOINT);
    // this.socket.on("set id", msg => {
    //     console.log("set id ", msg);
    // });
    // this.socket.on("setHost", msg => {
    //   console.log("setHost: ", msg);
    // });
    // this.socket.on("changeVideoClient", data => {
    //       console.log("changeVideoClient\n");
    //       console.log(data);
    // });
    this.state = {
      username:'',
      room:'',
      url:'',
        videoId:'',
      submit: false
    }
  }

  componentDidMount() {
      this.socket.on("setHost", msg => {
          console.log("setHost: ", msg);
      });
      this.socket.on("changeVideoClient", data => {
          console.log("changeVideoClient\n");
          console.log(data);
          this.setState({
              videoId: data.videoId
          })
      });
  }

    onSubmit = (username, room, url) => {
    this.socket.emit('new user', username, data=>{
      console.log("data: ", data)
    });
    this.setState({
        username:username,
        room:room,
        url:url,
        submit:true
    });
    this.socket.emit('new room', room);

  }
  render(){
    return (
      <View style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center"
        }}>
      {!this.state.submit && <LoginPage socket={this.socket} onSubmit={(username, room, url) => this.onSubmit(username, room, url)}/>}
      {this.state.submit && <VideoPage videoId={this.state.videoId} socket={this.socket}/>}
      </View>
    );
  }
}
export default HackScApp;