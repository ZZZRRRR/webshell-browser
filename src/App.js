import React, { Component } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import './App.css';
import './xterm.css';

interface IProps {

}

class TabData {

}

interface IState {
  planetWidth: number;
  planetHeight: number;
  display: string;
  tabIndex: number;
  tabData: TabData;
  project: string;
  time: number,
  hour: string,
  minute: string,
  second: string,
  score: string,
  info: null,
}

class App extends Component<IProps, IState> {

  websocket: WebSocket;
  terminal: Terminal;
  fitAddon: FitAddon;

  constructor(props) {
    super(props);
    this.state = {
      planetWidth: 900,
      planetHeight: 800,
      display: 'flex',
      tabIndex: 1,
      project: "项目1",

      tabData: {
        "experiment_target": "实验目标：1...,2...,3...", "case_describe": "案例描述：...", "experiment_data": "实验数据:...", "experiment_tips": "实验提示:...",
        "mark_point": [
          { "name": "判分点一", "demand": "实验要求一：创建一个名为hadoop的普通用户", "content": "实验内容一：使用root登录系统。。。。" },
          { "name": "判分点二", "demand": "实验要求二：三十三分是否是否", "content": "实验内容二：ssddssss" },
          { "name": "判分点三", "demand": "要求三", "content": "内容三." }
        ],
        "project_name": ["项目一", "项目二", "项目三"]
      },
      time: 3600000,
      hour: '0',
      minute: '0',
      second: '0',
      score: '--',

      info: { "usrID": "zr", "proID": "1", "exec": "restart" }
    }
  }

  countFun() {
    let sys_second = this.state.time;
    this.timer = setInterval(() => {
      if (sys_second > 1000) {
        sys_second -= 1000;
        let hour = Math.floor((sys_second / 1000 / 3600) % 24);
        let minute = Math.floor((sys_second / 1000 / 60) % 60);
        let second = Math.floor((sys_second / 1000) % 60);
        this.setState({
          hour: hour < 10 ? '0' + hour : hour,
          minute: minute < 10 ? '0' + minute : minute,
          second: second < 10 ? '0' + second : second
        })
      } else {
        clearInterval(this.timer);
      }
    }, 1000);
  }

  componentDidMount() {
    this.resize()
    window.addEventListener('resize', this.resize);
    this._init();
    this.countFun();
  }

  componentWillUnmount() {
    this.websocket.close();
    window.removeEventListener('resize', this.resize);
    this.fitAddon.dispose();
    this.terminal.dispose();
    clearInterval(this.timer);
  }

  resize() {
    document.getElementById('terminal').style.height = window.innerHeight + 'px';
    document.getElementById('terminal').style.width = window.innerWidth + 'px';
  }

  getData() {
    fetch(
      'http://ip', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
    })
      .then(res => res.json())
      .then(data => {
        this.setState({
          tabData: data
        })
      })
  }

  submit() {
    fetch(
      'http://ip', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(this.info)
    })
      .then()
  }

  reopen() {
    fetch(
      'http://192.168.11.187/open', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(this.info)
    })
      .then(window.location.reload());
  }

  _init() {
    this.initWS({ usrID: "zr", proID: 1, exec: "start1" })
      .then(data => {
        this._initTerminal();
        this.websocket = data.websocket;
        const msg = data.event.data;
        if (msg) {
          this.terminal.write(msg);
        }
        this.websocket.addEventListener("message", (event) => {
          console.log('on ws received msg', event);
          const msg = event.data;
          if (msg) {
            this.terminal.write(msg);
          }
        })
      })
  }

  //初始化websocket连接
  initWS(param: { usrID: string, proID: number, exec: string }): Promise<{ websocket: WebSocket, event: MessageEvent }> {
    return fetch(
      'http://192.168.11.187:8081/open', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(param)
    })
      .then(res => res.json())
      .then(data => new Promise((resolve, reject) => {
        console.log('response', data);
        const websocket = new WebSocket("ws://192.168.11.187:8081/websocket")
        websocket.onopen = () => {
          console.log('on ws open');
          websocket.send(data['token']);
        }
        websocket.onclose = (event) => {
          reject(event);
        }
        websocket.onmessage = (event) => {
          websocket.onopen = null;
          websocket.onclose = null;
          websocket.onmessage = null;
          resolve({ websocket, event });
        }
      }))
      .catch(error => {
        console.log("websocket init", error);
        throw error;
      })
  }

  _initTerminal() {
    this.terminal = new Terminal();
    this.fitAddon = new FitAddon();
    this.terminal.loadAddon(this.fitAddon)
    this.terminal.open(document.getElementById('terminal'));
    this.terminal.onKey(this._onKeyboardListener)
    this.fitAddon.fit();
  }

  _onKeyboardListener = (event) => {
    if (!this.websocket) {
      return;
    }
    this.websocket.send(event.key);
  }

  onShow() {
    if (this.state.planetWidth === 0) {
      this.setState({
        planetWidth: 900,
        planetHeight: 800,
        display: 'flex',
      })
    }
    else {
      this.setState({
        planetWidth: 0,
        planetHeight: 0,
        display: 'none',
      })
    }
  }

  getProjectValue = (event) => {
    this.setState({
      project: event.target.value
    })
  }

  render() {
    return (
      <div>

        {/*最上面的栏目*/}
        <div style={{ height: 30, width: '100%', backgroundColor: 'blue', display: 'flex', flexDirection: 'row' }}>
          <div>大数据实验平台</div>
          <div style={{ flex: 1 }} />
          <button style={{ marginRight: 60 }}>返回</button>
        </div>

        <div id="terminal">

          {/*下面的整体大框架*/}
          <div style={{ zIndex: 20, position: 'absolute', top: 38, width: this.state.planetWidth, height: this.state.planetHeight, backgroundColor: 'yellow', display: this.state.display, flexDirection: 'column' }}>

            {/*下面大框架内的标题栏*/}
            <div style={{ display: 'flex', flexDirection: 'row', height: 50, alignSelf: 'stretch', backgroundColor: 'white' }}>

              {/*标题栏里的下拉菜单*/}
              <div style={{ marginLeft: 30, marginTop: 10 }}>
                {this.state.project}
              </div>

              {/*计时器*/}
              <span style={{ alignSelf: 'center', marginLeft: 200 }}>{this.state.hour}:{this.state.minute}:{this.state.second}</span>

              {/*得分情况*/}
              <span style={{ alignSelf: 'center', marginLeft: 400 }}>得分情况{this.state.score}</span>

            </div>

            {/*下面大框架里的大块*/}
            <div style={{ display: 'flex', flexDirection: 'row', flex: 1, alignSelf: 'stretch', backgroundColor: 'yellow', marginTop: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', flex: 2, alignSelf: 'stretch', backgroundColor: 'red', margin: 16 }}>

                {/*下面框架左边大块的上半部分*/}
                <div style={{ flex: 1, backgroundColor: 'brown' }}>
                  <h6 style={{ display: this.state.display }}>实训目标</h6>

                  {/*下面框架左边的上半部分的边框*/}
                  <div style={{ width: 300, height: 150, alignSelf: 'center', margin: 'auto', borderStyle: 'solid', borderWidth: 2, borderColor: '#eee' }}>
                    <div>{this.state.tabData["experiment_target"]}</div>
                  </div>
                </div>

                {/*下面框架左边的下半部分*/}
                <div style={{ flex: 2, backgroundColor: 'green' }}>
                  <h6 style={{ display: this.state.display }}>实训内容</h6>

                  {/*下面框架左边的下半部分的边框*/}
                  <div style={{ width: 300, height: 400, alignSelf: 'center', margin: 'auto', borderStyle: 'solid', borderWidth: 2, borderColor: '#eee' }}>
                    <div style={{ marginLeft: 10 }}>判分指标-----完成结果-----得分</div>
                    <div>{
                      this.state.tabData["mark_point"].map((item) => {
                        return (
                          <div>
                            <p>{item["name"]}</p>
                          </div>
                        )
                      })
                    }</div>
                  </div>
                </div>
              </div>

              {/*下面大框架的右边大块*/}
              <div style={{ display: 'flex', flexDirection: 'column', flex: 3, alignSelf: 'stretch', backgroundColor: 'purple', padding: 16 }}>

                {/*下面大框架的右边列表按钮*/}
                <div style={{ display: 'flex', flexDirection: 'row', height: 45, aligsSelf: 'stretch', justifyContent: 'space-around', padding: 8, backgroundColor: 'blue' }}>
                  <button onClick={this._onPlanetTabClicked.bind(this, 1)}>案例描述</button>
                  <button onClick={this._onPlanetTabClicked.bind(this, 2)}>实验要求</button>
                  <button onClick={this._onPlanetTabClicked.bind(this, 3)}>实验内容</button>
                  <button onClick={this._onPlanetTabClicked.bind(this, 4)}>实验数据</button>
                </div>
                {this._renderPlanetTab()}

                {/*下面大框架的右边最下面的按钮栏*/}
                <div style={{ display: 'flex', flexDirection: 'row', height: 45, alignSelf: 'stretch', justifyContent: 'space-around', backgroundColor: 'blue', padding: 8 }}>
                  <button onClick={this.submit.bind(this)}>提交</button>
                  <button onClick={this.reopen.bind(this)}>重做</button>
                </div>
              </div>

            </div>

          </div>
          <button style={{ zIndex: 30, position: 'absolute', top: 300, left: this.state.planetWidth }} onClick={this.onShow.bind(this)}>实验面板</button>
        </div>
      </div>
    );
  }


  _onPlanetTabClicked(tabIndex: number) {
    this.setState({ tabIndex })
  }

  _renderPlanetTab() {
    const tabIndex = this.state.tabIndex;
    switch (tabIndex) {
      case 1:
        return (
          <div style={{ display: this.state.display, flex: 1, alignSelf: 'stretch', borderStyle: 'solid', borderWidth: 2, borderColor: '#eee' }}>
            <div>{this.state.tabData["case_describe"]}</div>
          </div>
        );
      case 2:
        return (
          <div style={{ display: this.state.display, flex: 1, alignSelf: 'stretch', borderStyle: 'solid', borderWidth: 2, borderColor: '#eee' }}>
            <div>{
              this.state.tabData["mark_point"].map((item) => {
                return (

                  <div>
                    <p>{item["demand"]}</p>
                  </div>
                )
              })
            }</div>
          </div>
        );
      case 3:
        return (
          <div style={{ display: this.state.display, flex: 1, alignSelf: 'stretch', borderStyle: 'solid', borderWidth: 2, borderColor: '#eee' }}>
            <div>{
              this.state.tabData["mark_point"].map((item) => {
                return (

                  <div>
                    <p>{item["content"]}</p>
                  </div>
                )
              })
            }</div>
          </div>
        );
      case 4:
        return (
          <div style={{ display: this.state.display, flex: 1, alignSelf: 'stretch', borderStyle: 'solid', borderWidth: 2, borderColor: '#eee' }}>
            <div>{this.state.tabData['experiment_data']}</div>
          </div>
        );
    }
  }
}

export default App;

