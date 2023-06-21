"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.report_usage_stats = exports.report_increase_a_counter = exports.report_success_or_failure = void 0;
/* eslint-disable @typescript-eslint/naming-convention */
const vscode = require("vscode");
const fetchH2 = require("fetch-h2");
const fetchAPI = require("./fetchAPI");
const userLogin = require("./userLogin");
async function report_success_or_failure(positive, scope, related_url, error_message, model_name) {
    let invalid_session = false;
    let timedout = false;
    let conn_refused = false;
    if (typeof error_message !== "string") {
        if (error_message.code && error_message.code.includes("INVALID_SESSION")) {
            invalid_session = true;
        }
        if (error_message.code && error_message.code.includes("ETIMEDOUT")) {
            timedout = true;
        }
        if (error_message.code && error_message.code.includes("ECONNREFUSED")) {
            conn_refused = true;
        }
        if (error_message instanceof Error && error_message.message) {
            error_message = error_message.message;
        }
        else {
            error_message = JSON.stringify(error_message);
        }
    }
    if (typeof error_message === "string") {
        if (error_message.includes("INVALID_SESSION")) {
            invalid_session = true;
        }
        if (error_message.includes("ETIMEDOUT") || error_message.includes("timed out")) {
            timedout = true;
        }
        if (error_message.includes("ECONNREFUSED")) {
            conn_refused = true;
        }
    }
    if (!positive) {
        await fetchH2.disconnectAll();
        await fetchAPI.non_verifying_ctx.disconnectAll();
    }
    else {
        global.last_positive_result = Date.now();
    }
    if (invalid_session || conn_refused) {
        userLogin.inference_login_force_retry();
        console.log(["INVALID_SESSION, ECONNREFUSED => inference_login_force_retry"]);
    }
    if (timedout) {
        userLogin.inference_login_force_retry();
        // console.log(["ETIMEDOUT => disconnectAll"]);
    }
    if (error_message.length > 200) {
        error_message = error_message.substring(0, 200) + "…";
    }
    if (model_name) {
        global.status_bar.url_and_model_worked(related_url, model_name);
    }
    global.status_bar.set_socket_error(!positive, error_message);
    if (userLogin.check_if_login_worked()) {
        if (global.side_panel) {
            global.side_panel.update_webview();
        }
    }
    else {
        if (global.side_panel) {
            global.side_panel.update_webview();
        }
        global.status_bar.url_and_model_worked("", "");
    }
    let error_message_json = JSON.stringify(error_message);
    let msg = `${positive ? "1" : "0"}\t${scope}\t${related_url}\t${error_message_json}`; // tabs for field separation, still human readable
    // Typical msg:
    // 1  "completion"  https://inference.smallcloud.ai/v1/contrast  ""
    // 0  "completion"  https://inference.smallcloud.ai/v1/contrast  "Could not verify your API key (3)"
    console.log([msg]);
    let global_context = global.global_context;
    if (global_context !== undefined) {
        let count_msg = await global_context.globalState.get("usage_stats");
        if (typeof count_msg !== "object") {
            count_msg = {};
        }
        if (count_msg[msg] === undefined) {
            count_msg[msg] = 1;
        }
        else {
            count_msg[msg] += 1;
        }
        await global_context.globalState.update("usage_stats", count_msg);
    }
}
exports.report_success_or_failure = report_success_or_failure;
async function report_increase_a_counter(scope, counter_name) {
    let global_context = global.global_context;
    if (!global_context) {
        return;
    }
    console.log(["increase_a_counter", scope, counter_name]);
    // {"scope1": {"counter1": 5, "counter2": 6}, "scope2": {"counter1": 5, "counter2": 6}}
    let usage_counters = await global_context.globalState.get("usage_counters");
    if (typeof usage_counters !== "object") {
        usage_counters = {};
    }
    if (usage_counters[scope] === undefined) {
        usage_counters[scope] = {};
    }
    if (usage_counters[scope][counter_name] === undefined) {
        usage_counters[scope][counter_name] = 1;
    }
    else {
        usage_counters[scope][counter_name] += 1;
    }
    await global_context.globalState.update("usage_counters", usage_counters);
}
exports.report_increase_a_counter = report_increase_a_counter;
async function report_usage_stats() {
    let global_context = global.global_context;
    if (global_context === undefined) {
        return;
    }
    let count_msg = await global_context.globalState.get("usage_stats");
    if (count_msg === undefined) {
        return;
    }
    let usage = "";
    for (let key in count_msg) {
        usage += `${key}\t${count_msg[key]}\n`;
    }
    const apiKey = userLogin.secret_api_key();
    if (!apiKey) {
        return;
    }
    let client_version = vscode.extensions.getExtension("smallcloud.codify").packageJSON.version;
    const headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
    };
    let url = "https://www.smallcloud.ai/v1/usage-stats";
    let response = await fetchH2.fetch(url, {
        method: "POST",
        headers: headers,
        body: JSON.stringify({
            "client_version": `vscode-${client_version}`,
            "usage": usage,
        }),
    });
    if (response.status !== 200) {
        console.log([response.status, url]);
        return;
    }
    await global_context.globalState.update("usage_stats", {});
    let usage_counters = await global_context.globalState.get("usage_counters");
    let usage_counters_size = usage_counters ? Object.keys(usage_counters).length : 0;
    if (usage_counters && usage_counters_size > 0) {
        url = "https://www.smallcloud.ai/v1/accept-reject-stats";
        usage_counters["ide_version"] = vscode.version;
        usage_counters["plugin_version"] = `vscode-${client_version}`;
        let usage_counters_str = JSON.stringify(usage_counters);
        response = await fetchH2.fetch(url, {
            method: "POST",
            headers: headers,
            body: JSON.stringify({
                "client_version": `vscode-${client_version}`,
                "usage": usage_counters_str,
            }),
        });
        if (response.status !== 200) {
            console.log([response.status, url]);
            return;
        }
        await global_context.globalState.update("usage_counters", undefined);
    }
}
exports.report_usage_stats = report_usage_stats;
//# sourceMappingURL=usageStats.js.map