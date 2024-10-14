/**
 * Copyright 2022 Bart Butenaers
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/
 module.exports = function(RED) {
    var settings = RED.settings;
    const v8ProfilerNext = require('v8-profiler-next');

    function V8CpuProfilerNode(config) {
        RED.nodes.createNode(this,config)
        this.timeout = config.timeout
        this.format = config.format | "tree"
        this.profilerEnabled = false

        let node = this

        function startProfiling() {
            if (node.timeout > 0) {
                node.timer = setTimeout(function() {
                    stopProfiling(false)
                }, node.timeout * 1000)
            }

            switch(node.format) {
                case "flat":
                    // Old format
                    v8ProfilerNext.setGenerateType(0)
                    break
                case "tree":
                    // New format (e.g. for parsing in Chrome and VsCode)
                    v8ProfilerNext.setGenerateType(1)
                    break
            }

            // Pass the id of this node as title, to allow the V8 profiler to collect several profiles at once.
            // Which means one profile for each v8_profiler node
            v8ProfilerNext.startProfiling(node.id, true)
            node.startTimestamp = Date.now()
            node.profilerEnabled = true

            node.status({fill:"blue", shape:"dot", text:"profiling..."})
        }

        function stopProfiling(interrupted) {
            if(node.timer) {
                clearTimeout(node.timer)
            }

            node.status({fill:"blue", shape:"dot", text:"stopping..."})

            const profile = v8ProfilerNext.stopProfiling(node.id)
            node.endTimestamp = Date.now()

            profile.export(function(err, result) {
                if (err) {
                    node.error('Cannot export profile: ' + err)
                }
                else {
                    var outputMsg = {
                        payload: {
                            profile: result,
                            startTimestamp: node.startTimestamp,
                            endTimestamp: node.endTimestamp
                        }
                    }

                    if (interrupted) {
                        // Premature interrupted profiles will be send on the second output
                        node.send([null, outputMsg])
                    }
                    else {
                        // Entirely completed profiles will be send on the first output
                        node.send([outputMsg, null])
                    }
                }

                node.status({})
                node.profilerEnabled = false
            })
        }

        node.status({})

        node.on("input", function(msg) {
            switch(msg.payload) {
                case "start_profiling":
                    if(node.profilerEnabled) {
                        node.warn("The profiler is already started")
                    }
                    else {
                        startProfiling()
                    }
                    break
                case "stop_profiling":
                    if(!node.profilerEnabled) {
                        node.warn("The profiler was not started yet")
                    }
                    else {
                        stopProfiling(true)
                    }
                    break
                default:
                    node.error("Unsupported action in msg.payload")
            }
        })

        node.on("close", function() {
            if (node.profilerEnabled) {
                stopProfiling(true)
            }
        })
    }

    RED.nodes.registerType("v8-cpu-profiler", V8CpuProfilerNode)
}
