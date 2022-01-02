# node-red-contrib-v8-cpu-profiler
A Node-RED node to start CPU profiling on the V8 engine (used by NodeJs).

## Install
Run the following npm command in your Node-RED user directory (typically ~/.node-red):
```
npm install node-red-contrib-v8-cpu-profiler
```

## Support my Node-RED developments
Please buy my wife a coffee to keep her happy, while I am busy developing Node-RED stuff for you ...

<a href="https://www.buymeacoffee.com/bartbutenaers" target="_blank"><img src="https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png" alt="Buy my wife a coffee" style="height: 41px !important;width: 174px !important;box-shadow: 0px 3px 2px 0px rgba(190, 190, 190, 0.5) !important;-webkit-box-shadow: 0px 3px 2px 0px rgba(190, 190, 190, 0.5) !important;" ></a>

## Node usage

This node can be used to start and stop (manually or automatically) a CPU profiling, in case you need to analyze why Node-RED is using much CPU. 

The following example flow shows how profiling can be started and stopped manually:

![example flow](https://user-images.githubusercontent.com/14224149/147891039-060c350b-e21c-48e6-aeec-3804bee6311e.png)
```
[{"id":"563b8f929d5b402f","type":"inject","z":"f3e346780eaa6c3c","name":"Start profiling","props":[{"p":"payload"}],"repeat":"","crontab":"","once":false,"onceDelay":0.1,"topic":"","payload":"start_profiling","payloadType":"str","x":410,"y":1300,"wires":[["2a2bf09c08c27940"]]},{"id":"61c69682821e25dd","type":"inject","z":"f3e346780eaa6c3c","name":"Stop profiling","props":[{"p":"payload"}],"repeat":"","crontab":"","once":false,"onceDelay":0.1,"topic":"","payload":"stop_profiling","payloadType":"str","x":410,"y":1360,"wires":[["2a2bf09c08c27940"]]},{"id":"f917781ef1253bb4","type":"file","z":"f3e346780eaa6c3c","name":"","filename":"C:\\temp\\nodered.cpuprofile","appendNewline":false,"createDir":false,"overwriteFile":"true","encoding":"none","x":900,"y":1300,"wires":[[]]},{"id":"2a2bf09c08c27940","type":"v8-cpu-profiler","z":"f3e346780eaa6c3c","timeout":"20","name":"","x":640,"y":1300,"wires":[["f917781ef1253bb4"]]}]
```
These are the basic steps that need to be executed:

1. Start the profiling by injecting `msg.payload = "start_profiling"`.  In this flow the profiling will be started manually via the inject code.  But of course it is also possible to do this automatically: e.g. create a flow that injects a message as soon as the CPU usage is higher than a specified threshold during some time interval.  This can be very useful when the CPU usage is only high at unpredictable times, so it is impossible to start the profiling manuaaly in this case.

2. Execute some actions in Node-RED that consume lots of CPU.

3. Stop the profiling by injecting `msg.payload = "stop_profiling"`.

   Note that a timeout of 20 seconds has been specified in the node's config screen.  This means that the profiling will be ended after 20 seconds, unless the profiling is stopped earlier via an input message.

4. As soon as the profiling is stopped, an output message will be send.  The payload will contain the profiling result (in json format).

5. The File-Write node will store the json result in a ***.cpuprofile*** file.

6. Open the .cpuprofile file in a third party tool to show the ***flamegraph***.  See [this](https://github.com/bartbutenaers/node-red-contrib-v8-cpu-profiler/wiki/Visualize-the-.cpuprofile-file-in-Chrome-Developer-Tools) wiki page how to achieve this via the Chrome Developer Tools.

## Node properties

### Timeout

Specify after which time interval (in seconds) the profiling should be stopped, in case no `stop_profiling` is injected within that interval. A timeout value of `0` means no timeout.</p>
