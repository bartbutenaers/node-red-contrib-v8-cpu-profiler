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
        RED.nodes.createNode(this,config);
        this.timeout = config.timeout;
        this.profilerEnabled = false;

        var node = this;

        function startProfiling() {
            if (node.timeout > 0) {
                node.timer = setTimeout(function() {
                    stopProfiling();
                }, node.timeout * 1000);
            }
            
            // Pass the id of this node as title, to allow the V8 profiler to collect several profiles at once.
            // Which means one profile for each v8_profiler node
            v8ProfilerNext.startProfiling(node.id, true);
            node.profilerEnabled = true;
            
            node.status({fill:"blue", shape:"dot", text:"profiling..."});
        }
        
        function stopProfiling() {
            if(node.timer) {
                clearTimeout(node.timer);
            }
            
            node.status({fill:"blue", shape:"dot", text:"stopping..."});
            
            const profile = v8ProfilerNext.stopProfiling(node.id);

            profile.export(function(err, result) {
                if (err) {
                    node.error('Cannot export profile: ' + err);
                }
                else {
                    node.send({ payload: result });
                }
                
                node.status({});
                node.profilerEnabled = false;
            });
        }
        
        node.status({});

        node.on("input", function(msg) {
            switch(msg.payload) {
                case "start_profiling":
                    if(node.profilerEnabled) {
                        node.warn("The profiler is already started");
                    }
                    else {
                        startProfiling();
                    }
                    break;
                case "stop_profiling":
                    if(!node.profilerEnabled) {
                        node.warn("The profiler was not started yet");
                    }
                    else {
                        stopProfiling();
                    }
                    break;
                default:
                    node.error("Unsupported action in msg.payload");
            }
        });
        
        node.on("close", function() {
            if (node.profilerEnabled) {
                stopProfiling();
            }
        });
    }

    RED.nodes.registerType("v8-cpu-profiler", V8CpuProfilerNode);
}