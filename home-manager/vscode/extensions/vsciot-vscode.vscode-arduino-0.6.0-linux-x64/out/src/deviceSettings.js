"use strict";
// Copyright (c) Elektronik Workshop. All rights reserved.
// Licensed under the MIT license.
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeviceSettings = void 0;
const fs = require("fs");
const path = require("path");
const vscode = require("vscode");
const constants = require("./common/constants");
const util = require("./common/util");
const logger = require("./logger/logger");
/**
 * Generic class which provides monitoring of a specific settings value.
 * If the value is modified a flag is set and an event is emitted.
 *
 * Usually you want to specialize the setter for any given value type
 * to prevent invalid or badly formatted values to enter your settings.
 */
class Setting {
    constructor(defaultValue) {
        /** Event emitter which fires when the value is changed. */
        this._emitter = new vscode.EventEmitter();
        this.default = defaultValue;
        this._value = this.default;
    }
    /**
     * Value-setter - sets the value.
     * If modified, the modified flag is set and the modified event is
     * fired.
     */
    set value(value) {
        if (value !== this._value) {
            this._value = value;
            this._modified = true;
            this._emitter.fire(this._value);
        }
    }
    /** Value-getter - returns the internal value. */
    get value() {
        return this._value;
    }
    /**
     * Returns true, if the internal value has been modified.
     * To clear the modified flag call commit().
     */
    get modified() {
        return this._modified;
    }
    /** Returns the modified-event emitter. */
    get emitter() {
        return this._emitter;
    }
    /**
     * Returns the internal value to its default value.
     * If the default value is different from the previous value,
     * it triggers the modified event and the modified flag is set.
     */
    reset() {
        this.value = this.default;
    }
    /** Reset the modified flag (if you know what you're doing) */
    commit() {
        this._modified = false;
    }
}
/**
 * String specialization of the Setting class.
 */
class StrSetting extends Setting {
    /**
     * When we override setter (below) we have to override getter as well
     * (see JS language specs).
     */
    get value() {
        return super.value;
    }
    /**
     * Set string value. Anything else than a string will set the value to
     * its default value (undefined). White spaces at the front and back are
     * trimmed before setting the value.
     * If the setting's value is changed during this operation, the base
     * class' event emitter will fire and the modified flag will be set.
     */
    set value(value) {
        if (typeof value !== "string") {
            value = this.default;
        }
        else {
            value = value.trim();
        }
        super.value = value;
    }
}
class BuildPrefSetting extends Setting {
    get value() {
        return super.value;
    }
    set value(value) {
        if (!Array.isArray(value)) {
            super.value = super.default;
            return;
        }
        if (value.length <= 0) {
            super.value = super.default;
            return;
        }
        for (const pref of value) {
            if (!Array.isArray(pref) || pref.length !== 2) {
                super.value = super.default;
                return;
            }
            for (const i of pref) {
                if (typeof i !== "string") {
                    super.value = super.default;
                    return;
                }
            }
        }
        super.value = value;
    }
}
/**
 * This class encapsulates all device/project specific settings and
 * provides common operations on them.
 */
class DeviceSettings {
    constructor() {
        this.port = new StrSetting();
        this.board = new StrSetting();
        this.sketch = new StrSetting();
        this.output = new StrSetting();
        this.intelliSenseGen = new StrSetting();
        this.configuration = new StrSetting();
        this.prebuild = new StrSetting();
        this.postbuild = new StrSetting();
        this.programmer = new StrSetting();
        this.buildPreferences = new BuildPrefSetting();
    }
    /**
     * @returns true if any of the settings values has its modified flag
     * set.
     */
    get modified() {
        return this.port.modified ||
            this.board.modified ||
            this.sketch.modified ||
            this.output.modified ||
            this.intelliSenseGen.modified ||
            this.configuration.modified ||
            this.prebuild.modified ||
            this.postbuild.modified ||
            this.programmer.modified ||
            this.buildPreferences.modified;
    }
    /**
     * Clear modified flags of all settings values.
     */
    commit() {
        this.port.commit();
        this.board.commit();
        this.sketch.commit();
        this.output.commit();
        this.intelliSenseGen.commit();
        this.configuration.commit();
        this.prebuild.commit();
        this.postbuild.commit();
        this.programmer.commit();
        this.buildPreferences.commit();
    }
    /**
     * Resets all settings values to their default values.
     * @param commit If true clear the modified flags after all values are
     * reset.
     */
    reset(commit = true) {
        this.port.reset();
        this.board.reset();
        this.sketch.reset();
        this.output.reset();
        this.intelliSenseGen.reset();
        this.configuration.reset();
        this.prebuild.reset();
        this.postbuild.reset();
        this.programmer.reset();
        this.buildPreferences.reset();
        if (commit) {
            this.commit();
        }
    }
    /**
     * Load settings values from the given file.
     * If a value is changed through this operation, its event emitter will
     * fire.
     * @param file Path to the file the settings should be loaded from.
     * @param commit If true reset the modified flags after all values are read.
     * @returns true if the settings are loaded successfully.
     */
    load(file, commit = true) {
        const settings = util.tryParseJSON(fs.readFileSync(file, "utf8"));
        if (settings) {
            this.port.value = settings.port;
            this.board.value = settings.board;
            this.sketch.value = settings.sketch;
            this.configuration.value = settings.configuration;
            this.output.value = settings.output;
            this.intelliSenseGen.value = settings.intelliSenseGen;
            this.prebuild.value = settings.prebuild;
            this.postbuild.value = settings.postbuild;
            this.programmer.value = settings.programmer;
            this.buildPreferences.value = settings.buildPreferences;
            if (commit) {
                this.commit();
            }
            return true;
        }
        else {
            logger.notifyUserError("arduinoFileError", new Error(constants.messages.ARDUINO_FILE_ERROR));
            return false;
        }
    }
    /**
     * Writes the settings to the given file if there are modified
     * values. The modification flags are reset (commit()) on successful write.
     * On write failure the modification flags are left unmodified.
     * @param file Path to file the JSON representation of the settings should
     * written to. If either the folder or the file does not exist they are
     * created.
     * @returns true on succes, false on write failure.
     */
    save(file) {
        if (!this.modified) {
            return true;
        }
        let settings = {};
        if (util.fileExistsSync(file)) {
            settings = util.tryParseJSON(fs.readFileSync(file, "utf8"));
        }
        if (!settings) {
            logger.notifyUserError("arduinoFileError", new Error(constants.messages.ARDUINO_FILE_ERROR));
            return false;
        }
        settings.sketch = this.sketch.value;
        settings.port = this.port.value;
        settings.board = this.board.value;
        settings.output = this.output.value;
        settings.intelliSenseGen = this.intelliSenseGen.value;
        settings.configuration = this.configuration.value;
        settings.programmer = this.programmer.value;
        util.mkdirRecursivelySync(path.dirname(file));
        fs.writeFileSync(file, JSON.stringify(settings, undefined, 4));
        this.commit();
        return true;
    }
}
exports.DeviceSettings = DeviceSettings;

//# sourceMappingURL=deviceSettings.js.map

// SIG // Begin signature block
// SIG // MIInoAYJKoZIhvcNAQcCoIInkTCCJ40CAQExDzANBglg
// SIG // hkgBZQMEAgEFADB3BgorBgEEAYI3AgEEoGkwZzAyBgor
// SIG // BgEEAYI3AgEeMCQCAQEEEBDgyQbOONQRoqMAEEvTUJAC
// SIG // AQACAQACAQACAQACAQAwMTANBglghkgBZQMEAgEFAAQg
// SIG // X51lp2yZyiAB81ZZf028H4lSND0PQOzCk7M6sSW8EnSg
// SIG // gg2FMIIGAzCCA+ugAwIBAgITMwAAAs3zZL/41ExdUQAA
// SIG // AAACzTANBgkqhkiG9w0BAQsFADB+MQswCQYDVQQGEwJV
// SIG // UzETMBEGA1UECBMKV2FzaGluZ3RvbjEQMA4GA1UEBxMH
// SIG // UmVkbW9uZDEeMBwGA1UEChMVTWljcm9zb2Z0IENvcnBv
// SIG // cmF0aW9uMSgwJgYDVQQDEx9NaWNyb3NvZnQgQ29kZSBT
// SIG // aWduaW5nIFBDQSAyMDExMB4XDTIyMDUxMjIwNDYwMloX
// SIG // DTIzMDUxMTIwNDYwMlowdDELMAkGA1UEBhMCVVMxEzAR
// SIG // BgNVBAgTCldhc2hpbmd0b24xEDAOBgNVBAcTB1JlZG1v
// SIG // bmQxHjAcBgNVBAoTFU1pY3Jvc29mdCBDb3Jwb3JhdGlv
// SIG // bjEeMBwGA1UEAxMVTWljcm9zb2Z0IENvcnBvcmF0aW9u
// SIG // MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA
// SIG // 6yM7GOtjJiq83q4Ju1HJ7vg7kh3YM0WVQiBovQmpRa4c
// SIG // LYivtxSA85TmG7P88x8Liwt4Yq+ecFYB6GguJYkMEOtM
// SIG // FckdexGT2uAUNvAuQEZcan7Xadx/Ea11m1cr0GlJwUFW
// SIG // TO91w8hldaFD2RhxlrYHarQVHetFY5xTyAkn/KZxYore
// SIG // ob0sR+SFViNIjp36nV2KD1lLVVDJlaltcgV9DbW0JUhy
// SIG // FOoZT76Pf7qir5IxVBQNi2wvQFkGyZh/tbjNJeJw0inw
// SIG // qnHL3SOZd84xJPclElJodSEIQxZ/uUi9iZpwhdI2RGeH
// SIG // +RxO8pAz/qIgN0Pn4SgrHoPtGhB4vg0T2QIDAQABo4IB
// SIG // gjCCAX4wHwYDVR0lBBgwFgYKKwYBBAGCN0wIAQYIKwYB
// SIG // BQUHAwMwHQYDVR0OBBYEFNFsph+Aj+7NfskJLRMG3C0L
// SIG // kfWcMFQGA1UdEQRNMEukSTBHMS0wKwYDVQQLEyRNaWNy
// SIG // b3NvZnQgSXJlbGFuZCBPcGVyYXRpb25zIExpbWl0ZWQx
// SIG // FjAUBgNVBAUTDTIzMDAxMis0NzA1MzAwHwYDVR0jBBgw
// SIG // FoAUSG5k5VAF04KqFzc3IrVtqMp1ApUwVAYDVR0fBE0w
// SIG // SzBJoEegRYZDaHR0cDovL3d3dy5taWNyb3NvZnQuY29t
// SIG // L3BraW9wcy9jcmwvTWljQ29kU2lnUENBMjAxMV8yMDEx
// SIG // LTA3LTA4LmNybDBhBggrBgEFBQcBAQRVMFMwUQYIKwYB
// SIG // BQUHMAKGRWh0dHA6Ly93d3cubWljcm9zb2Z0LmNvbS9w
// SIG // a2lvcHMvY2VydHMvTWljQ29kU2lnUENBMjAxMV8yMDEx
// SIG // LTA3LTA4LmNydDAMBgNVHRMBAf8EAjAAMA0GCSqGSIb3
// SIG // DQEBCwUAA4ICAQBOy0rrjTmwgVmLrbcSQIIpVyfdhqcl
// SIG // f304slx2f/S2817PzHypz8EcnZZgNmpNKxliwxYfPcwF
// SIG // hxSPLfSS8KXf1UaFRN/lss0yLJHWwZx239co6P/tLaR5
// SIG // Z66BSXXA0jCLB/k+89wpWPulp40k3raYNWP6Szi12aWY
// SIG // 2Hl0IhcKPRuZc1HEnfGFUDT0ABiApdiUUmgjZcwHSBQh
// SIG // eTzSqF2ybRKg3D2fKA6zPSnTu06lBOVangXug4IGNbGW
// SIG // J0A/vy1pc+Q9MAq4jYBkP01lnsTMMJxKpSMH5CHDRcaN
// SIG // EDQ/+mGvQ0wFMpJNkihkj7dJC7R8TRJ9hib3DbX6IVWP
// SIG // 29LbshdOXlxN3HbWGW3hqFNcUIsT2QJU3bS5nhTZcvNr
// SIG // gVW8mwGeFLdfBf/1K7oFUPVFHStbmJnPtknUUEAnHCsF
// SIG // xjrmIGdVC1truT8n1sc6OAUfvudzgf7WV0Kc+DpIAWXq
// SIG // rPWGmCxXykZUB1bZkIIRR8web/1haJ8Q1Zbz8ctoKGtL
// SIG // vWfmZSKb6KGUb5ujrV8XQIzAXFgQLJwUa/zo+bN+ehA3
// SIG // X9pf7C8CxWBOtbfjBIjWHctKVy+oDdw8U1X9qoycVxZB
// SIG // X4404rJ3bnR7ILhDJPJhLZ78KPXzkik+qER4TPbGeB04
// SIG // P00zI1JY5jd5gWFgFiORMXQtYp7qINMaypjllTCCB3ow
// SIG // ggVioAMCAQICCmEOkNIAAAAAAAMwDQYJKoZIhvcNAQEL
// SIG // BQAwgYgxCzAJBgNVBAYTAlVTMRMwEQYDVQQIEwpXYXNo
// SIG // aW5ndG9uMRAwDgYDVQQHEwdSZWRtb25kMR4wHAYDVQQK
// SIG // ExVNaWNyb3NvZnQgQ29ycG9yYXRpb24xMjAwBgNVBAMT
// SIG // KU1pY3Jvc29mdCBSb290IENlcnRpZmljYXRlIEF1dGhv
// SIG // cml0eSAyMDExMB4XDTExMDcwODIwNTkwOVoXDTI2MDcw
// SIG // ODIxMDkwOVowfjELMAkGA1UEBhMCVVMxEzARBgNVBAgT
// SIG // Cldhc2hpbmd0b24xEDAOBgNVBAcTB1JlZG1vbmQxHjAc
// SIG // BgNVBAoTFU1pY3Jvc29mdCBDb3Jwb3JhdGlvbjEoMCYG
// SIG // A1UEAxMfTWljcm9zb2Z0IENvZGUgU2lnbmluZyBQQ0Eg
// SIG // MjAxMTCCAiIwDQYJKoZIhvcNAQEBBQADggIPADCCAgoC
// SIG // ggIBAKvw+nIQHC6t2G6qghBNNLrytlghn0IbKmvpWlCq
// SIG // uAY4GgRJun/DDB7dN2vGEtgL8DjCmQawyDnVARQxQtOJ
// SIG // DXlkh36UYCRsr55JnOloXtLfm1OyCizDr9mpK656Ca/X
// SIG // llnKYBoF6WZ26DJSJhIv56sIUM+zRLdd2MQuA3WraPPL
// SIG // bfM6XKEW9Ea64DhkrG5kNXimoGMPLdNAk/jj3gcN1Vx5
// SIG // pUkp5w2+oBN3vpQ97/vjK1oQH01WKKJ6cuASOrdJXtjt
// SIG // 7UORg9l7snuGG9k+sYxd6IlPhBryoS9Z5JA7La4zWMW3
// SIG // Pv4y07MDPbGyr5I4ftKdgCz1TlaRITUlwzluZH9TupwP
// SIG // rRkjhMv0ugOGjfdf8NBSv4yUh7zAIXQlXxgotswnKDgl
// SIG // mDlKNs98sZKuHCOnqWbsYR9q4ShJnV+I4iVd0yFLPlLE
// SIG // tVc/JAPw0XpbL9Uj43BdD1FGd7P4AOG8rAKCX9vAFbO9
// SIG // G9RVS+c5oQ/pI0m8GLhEfEXkwcNyeuBy5yTfv0aZxe/C
// SIG // HFfbg43sTUkwp6uO3+xbn6/83bBm4sGXgXvt1u1L50kp
// SIG // pxMopqd9Z4DmimJ4X7IvhNdXnFy/dygo8e1twyiPLI9A
// SIG // N0/B4YVEicQJTMXUpUMvdJX3bvh4IFgsE11glZo+TzOE
// SIG // 2rCIF96eTvSWsLxGoGyY0uDWiIwLAgMBAAGjggHtMIIB
// SIG // 6TAQBgkrBgEEAYI3FQEEAwIBADAdBgNVHQ4EFgQUSG5k
// SIG // 5VAF04KqFzc3IrVtqMp1ApUwGQYJKwYBBAGCNxQCBAwe
// SIG // CgBTAHUAYgBDAEEwCwYDVR0PBAQDAgGGMA8GA1UdEwEB
// SIG // /wQFMAMBAf8wHwYDVR0jBBgwFoAUci06AjGQQ7kUBU7h
// SIG // 6qfHMdEjiTQwWgYDVR0fBFMwUTBPoE2gS4ZJaHR0cDov
// SIG // L2NybC5taWNyb3NvZnQuY29tL3BraS9jcmwvcHJvZHVj
// SIG // dHMvTWljUm9vQ2VyQXV0MjAxMV8yMDExXzAzXzIyLmNy
// SIG // bDBeBggrBgEFBQcBAQRSMFAwTgYIKwYBBQUHMAKGQmh0
// SIG // dHA6Ly93d3cubWljcm9zb2Z0LmNvbS9wa2kvY2VydHMv
// SIG // TWljUm9vQ2VyQXV0MjAxMV8yMDExXzAzXzIyLmNydDCB
// SIG // nwYDVR0gBIGXMIGUMIGRBgkrBgEEAYI3LgMwgYMwPwYI
// SIG // KwYBBQUHAgEWM2h0dHA6Ly93d3cubWljcm9zb2Z0LmNv
// SIG // bS9wa2lvcHMvZG9jcy9wcmltYXJ5Y3BzLmh0bTBABggr
// SIG // BgEFBQcCAjA0HjIgHQBMAGUAZwBhAGwAXwBwAG8AbABp
// SIG // AGMAeQBfAHMAdABhAHQAZQBtAGUAbgB0AC4gHTANBgkq
// SIG // hkiG9w0BAQsFAAOCAgEAZ/KGpZjgVHkaLtPYdGcimwuW
// SIG // EeFjkplCln3SeQyQwWVfLiw++MNy0W2D/r4/6ArKO79H
// SIG // qaPzadtjvyI1pZddZYSQfYtGUFXYDJJ80hpLHPM8QotS
// SIG // 0LD9a+M+By4pm+Y9G6XUtR13lDni6WTJRD14eiPzE32m
// SIG // kHSDjfTLJgJGKsKKELukqQUMm+1o+mgulaAqPyprWElj
// SIG // HwlpblqYluSD9MCP80Yr3vw70L01724lruWvJ+3Q3fMO
// SIG // r5kol5hNDj0L8giJ1h/DMhji8MUtzluetEk5CsYKwsat
// SIG // ruWy2dsViFFFWDgycScaf7H0J/jeLDogaZiyWYlobm+n
// SIG // t3TDQAUGpgEqKD6CPxNNZgvAs0314Y9/HG8VfUWnduVA
// SIG // KmWjw11SYobDHWM2l4bf2vP48hahmifhzaWX0O5dY0Hj
// SIG // Wwechz4GdwbRBrF1HxS+YWG18NzGGwS+30HHDiju3mUv
// SIG // 7Jf2oVyW2ADWoUa9WfOXpQlLSBCZgB/QACnFsZulP0V3
// SIG // HjXG0qKin3p6IvpIlR+r+0cjgPWe+L9rt0uX4ut1eBrs
// SIG // 6jeZeRhL/9azI2h15q/6/IvrC4DqaTuv/DDtBEyO3991
// SIG // bWORPdGdVk5Pv4BXIqF4ETIheu9BCrE/+6jMpF3BoYib
// SIG // V3FWTkhFwELJm3ZbCoBIa/15n8G9bW1qyVJzEw16UM0x
// SIG // ghlzMIIZbwIBATCBlTB+MQswCQYDVQQGEwJVUzETMBEG
// SIG // A1UECBMKV2FzaGluZ3RvbjEQMA4GA1UEBxMHUmVkbW9u
// SIG // ZDEeMBwGA1UEChMVTWljcm9zb2Z0IENvcnBvcmF0aW9u
// SIG // MSgwJgYDVQQDEx9NaWNyb3NvZnQgQ29kZSBTaWduaW5n
// SIG // IFBDQSAyMDExAhMzAAACzfNkv/jUTF1RAAAAAALNMA0G
// SIG // CWCGSAFlAwQCAQUAoIGuMBkGCSqGSIb3DQEJAzEMBgor
// SIG // BgEEAYI3AgEEMBwGCisGAQQBgjcCAQsxDjAMBgorBgEE
// SIG // AYI3AgEVMC8GCSqGSIb3DQEJBDEiBCCuOwfwk+u+DEve
// SIG // rCoNi01xWesrQzGHSB3BKKqTS6jc4DBCBgorBgEEAYI3
// SIG // AgEMMTQwMqAUgBIATQBpAGMAcgBvAHMAbwBmAHShGoAY
// SIG // aHR0cDovL3d3dy5taWNyb3NvZnQuY29tMA0GCSqGSIb3
// SIG // DQEBAQUABIIBAHInmd/xsSlY++eIdoVMqK2ckJ4LVld1
// SIG // t/sYUXv3JuegAQIeZ0bLqfoCjv8463ND5fAwjDkE8XbB
// SIG // NvBjBTdI7FjeTGDamd7Fj05WGz4S19FgekP9XM5gLf2H
// SIG // rWQzXjvAtDvJei0OLt1ZS6LqufQiYBCDpEG2KIDr0fyG
// SIG // OqfA2MTytCMfBizrt0MnSs7Bn407TozeAhcwspg72X1K
// SIG // 6gOFH/sEfFfOMil2weG/wONEu/Nq6X3NF4SwnsAo/98l
// SIG // SIBkPESJ5OwW66sG5/gQ3xkeQy09XdEY2wvoWzurAAFo
// SIG // VJlJCbX2YCPmmCjiyU7WD2NFMW+VmrwjEwdIxVRZKBb4
// SIG // i/Khghb9MIIW+QYKKwYBBAGCNwMDATGCFukwghblBgkq
// SIG // hkiG9w0BBwKgghbWMIIW0gIBAzEPMA0GCWCGSAFlAwQC
// SIG // AQUAMIIBUQYLKoZIhvcNAQkQAQSgggFABIIBPDCCATgC
// SIG // AQEGCisGAQQBhFkKAwEwMTANBglghkgBZQMEAgEFAAQg
// SIG // TQ9vSgnp7PfbEFrzCeowzZol0Xy7w2Ny7J+XhiqgOQoC
// SIG // BmPuGFiM/BgTMjAyMzAzMTUyMTA1MzUuNzczWjAEgAIB
// SIG // 9KCB0KSBzTCByjELMAkGA1UEBhMCVVMxEzARBgNVBAgT
// SIG // Cldhc2hpbmd0b24xEDAOBgNVBAcTB1JlZG1vbmQxHjAc
// SIG // BgNVBAoTFU1pY3Jvc29mdCBDb3Jwb3JhdGlvbjElMCMG
// SIG // A1UECxMcTWljcm9zb2Z0IEFtZXJpY2EgT3BlcmF0aW9u
// SIG // czEmMCQGA1UECxMdVGhhbGVzIFRTUyBFU046REQ4Qy1F
// SIG // MzM3LTJGQUUxJTAjBgNVBAMTHE1pY3Jvc29mdCBUaW1l
// SIG // LVN0YW1wIFNlcnZpY2WgghFUMIIHDDCCBPSgAwIBAgIT
// SIG // MwAAAcUDzc0hofTvOQABAAABxTANBgkqhkiG9w0BAQsF
// SIG // ADB8MQswCQYDVQQGEwJVUzETMBEGA1UECBMKV2FzaGlu
// SIG // Z3RvbjEQMA4GA1UEBxMHUmVkbW9uZDEeMBwGA1UEChMV
// SIG // TWljcm9zb2Z0IENvcnBvcmF0aW9uMSYwJAYDVQQDEx1N
// SIG // aWNyb3NvZnQgVGltZS1TdGFtcCBQQ0EgMjAxMDAeFw0y
// SIG // MjExMDQxOTAxMzJaFw0yNDAyMDIxOTAxMzJaMIHKMQsw
// SIG // CQYDVQQGEwJVUzETMBEGA1UECBMKV2FzaGluZ3RvbjEQ
// SIG // MA4GA1UEBxMHUmVkbW9uZDEeMBwGA1UEChMVTWljcm9z
// SIG // b2Z0IENvcnBvcmF0aW9uMSUwIwYDVQQLExxNaWNyb3Nv
// SIG // ZnQgQW1lcmljYSBPcGVyYXRpb25zMSYwJAYDVQQLEx1U
// SIG // aGFsZXMgVFNTIEVTTjpERDhDLUUzMzctMkZBRTElMCMG
// SIG // A1UEAxMcTWljcm9zb2Z0IFRpbWUtU3RhbXAgU2Vydmlj
// SIG // ZTCCAiIwDQYJKoZIhvcNAQEBBQADggIPADCCAgoCggIB
// SIG // AKtIXbO9Hl9tye6WqaWil0Yc/k0+ySdzr1X9/jfHzacU
// SIG // bOY2OIRL9wVf8ORFl22XTuJt8Y9NZUyP8Q5KvsrY7oj3
// SIG // vMRl7GcQ57b+y9RMzHeYyEqifnmLvJIFdOepqrPHQaOe
// SIG // cWTzz3MX+btfc59OGjEBeT11fwuGS0oxWvSBTXK4m3Tp
// SIG // t5Rlta0ERWto1LLqeoL+t+KuVMB9PVhhrtM/PUW7W8jO
// SIG // eb5gYFlfHnem2Qma3KGCIzC/BUU7xpc56puh7cGXVzMC
// SIG // h092v5C1Ej4hgLKyIBM8+zaQaXjrILPU68Mlk2QTWwcM
// SIG // iAApkN+I/rkeHrdoWZPjR+PSoRCcmA9vnTiGgxgdhFDR
// SIG // UmHMtTJILWbdXkagQdJvmD2M+x46HD8pCmDUGe07/s4J
// SIG // Tn3womsdYzm9LuiGAuV9Sa/AME3LGg8rt6gIcfHBUDfQ
// SIG // w4IlWcPlERWfKMqA5OrCFdZ8ec2S8voTbWpHj1/Uu2PJ
// SIG // 9alnwI6FzxOitP3W08POxDiS/wZSRnCqBU8ra9Mz4PzD
// SIG // SUm+n9mv8A5F6BghliYkKxk8Yzj/kfev5yCBtOXhNS6Z
// SIG // MthTnWDDweA4Vu7QXWWrrXqU07koZoJ/hihEfAKANYEk
// SIG // pNRAuWV+HKaVZ4CaW5TAbvK/7QoXx1XV74mOoQ0oR8EA
// SIG // pmamXm4EmB5x5eLqxPuCumQvAgMBAAGjggE2MIIBMjAd
// SIG // BgNVHQ4EFgQUVOq7OL9ZsTWBv67aS8K1cHpNBWswHwYD
// SIG // VR0jBBgwFoAUn6cVXQBeYl2D9OXSZacbUzUZ6XIwXwYD
// SIG // VR0fBFgwVjBUoFKgUIZOaHR0cDovL3d3dy5taWNyb3Nv
// SIG // ZnQuY29tL3BraW9wcy9jcmwvTWljcm9zb2Z0JTIwVGlt
// SIG // ZS1TdGFtcCUyMFBDQSUyMDIwMTAoMSkuY3JsMGwGCCsG
// SIG // AQUFBwEBBGAwXjBcBggrBgEFBQcwAoZQaHR0cDovL3d3
// SIG // dy5taWNyb3NvZnQuY29tL3BraW9wcy9jZXJ0cy9NaWNy
// SIG // b3NvZnQlMjBUaW1lLVN0YW1wJTIwUENBJTIwMjAxMCgx
// SIG // KS5jcnQwDAYDVR0TAQH/BAIwADATBgNVHSUEDDAKBggr
// SIG // BgEFBQcDCDANBgkqhkiG9w0BAQsFAAOCAgEAjKjefH6z
// SIG // BzknHIivgnZ6+nSvH07IEA3mfW70IwrsTSCWSfdvsaXi
// SIG // kQn916uO6nUcpJClJ2QunR4S8LdX4cMosvy33VUPcn9Y
// SIG // WGf0aU0vs9IZ2qCvj/yAwIlDZt9jVy4QwbtD+Em/7gle
// SIG // IzrjVHJiYaaQUIEFYRcf+eyWJNSwnYyHnv/xq3H25ELY
// SIG // mKG/Tmvdw0o27A9Y6monBJ5HJVDf5hJvWbJwpwNfvzkA
// SIG // 6f/EOHD3x/eCzOCel9DbTQXlcsL1h9MLjGjicx4Aywni
// SIG // VJBRPRxPLAQ1XnZo+szyQCPu6My42KsO4uERW4krX1mU
// SIG // ho8LfpSyUGUVlAnE92h2L06NWFg2bJKIVoO+8PXxdkG4
// SIG // jvQ356qGe0KMx4u0Yj6W44JCTAIa4aXk3/2rdnvfh2JC
// SIG // jm1JoDwKx9Vo4r8JtXez2FrGqy+7uambpN+hm9ZhE0ta
// SIG // ANl19/gt64Lc0aIT/PamVX+/ZVb45oN+DbSAiv6TJPfU
// SIG // gbrYIbYqRUjEHW11J0tqHi7fXCrr9TCbvoCfN6l0zZEN
// SIG // kKocbTUb2xPUKpqiUMOVVv+Emc3taT18cjkzucg6vokS
// SIG // FLm6nkM5lHApIsjbgix1ofDiwiOZiDgtYi7VQ39pcPXl
// SIG // q6KcLuUgybU/2cKiFNam9lPjY5DXI9YWzgwURC2k01nf
// SIG // dUSYlCPZ3CZBoP4wggdxMIIFWaADAgECAhMzAAAAFcXn
// SIG // a54Cm0mZAAAAAAAVMA0GCSqGSIb3DQEBCwUAMIGIMQsw
// SIG // CQYDVQQGEwJVUzETMBEGA1UECBMKV2FzaGluZ3RvbjEQ
// SIG // MA4GA1UEBxMHUmVkbW9uZDEeMBwGA1UEChMVTWljcm9z
// SIG // b2Z0IENvcnBvcmF0aW9uMTIwMAYDVQQDEylNaWNyb3Nv
// SIG // ZnQgUm9vdCBDZXJ0aWZpY2F0ZSBBdXRob3JpdHkgMjAx
// SIG // MDAeFw0yMTA5MzAxODIyMjVaFw0zMDA5MzAxODMyMjVa
// SIG // MHwxCzAJBgNVBAYTAlVTMRMwEQYDVQQIEwpXYXNoaW5n
// SIG // dG9uMRAwDgYDVQQHEwdSZWRtb25kMR4wHAYDVQQKExVN
// SIG // aWNyb3NvZnQgQ29ycG9yYXRpb24xJjAkBgNVBAMTHU1p
// SIG // Y3Jvc29mdCBUaW1lLVN0YW1wIFBDQSAyMDEwMIICIjAN
// SIG // BgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEA5OGmTOe0
// SIG // ciELeaLL1yR5vQ7VgtP97pwHB9KpbE51yMo1V/YBf2xK
// SIG // 4OK9uT4XYDP/XE/HZveVU3Fa4n5KWv64NmeFRiMMtY0T
// SIG // z3cywBAY6GB9alKDRLemjkZrBxTzxXb1hlDcwUTIcVxR
// SIG // MTegCjhuje3XD9gmU3w5YQJ6xKr9cmmvHaus9ja+NSZk
// SIG // 2pg7uhp7M62AW36MEBydUv626GIl3GoPz130/o5Tz9bs
// SIG // hVZN7928jaTjkY+yOSxRnOlwaQ3KNi1wjjHINSi947SH
// SIG // JMPgyY9+tVSP3PoFVZhtaDuaRr3tpK56KTesy+uDRedG
// SIG // bsoy1cCGMFxPLOJiss254o2I5JasAUq7vnGpF1tnYN74
// SIG // kpEeHT39IM9zfUGaRnXNxF803RKJ1v2lIH1+/NmeRd+2
// SIG // ci/bfV+AutuqfjbsNkz2K26oElHovwUDo9Fzpk03dJQc
// SIG // NIIP8BDyt0cY7afomXw/TNuvXsLz1dhzPUNOwTM5TI4C
// SIG // vEJoLhDqhFFG4tG9ahhaYQFzymeiXtcodgLiMxhy16cg
// SIG // 8ML6EgrXY28MyTZki1ugpoMhXV8wdJGUlNi5UPkLiWHz
// SIG // NgY1GIRH29wb0f2y1BzFa/ZcUlFdEtsluq9QBXpsxREd
// SIG // cu+N+VLEhReTwDwV2xo3xwgVGD94q0W29R6HXtqPnhZy
// SIG // acaue7e3PmriLq0CAwEAAaOCAd0wggHZMBIGCSsGAQQB
// SIG // gjcVAQQFAgMBAAEwIwYJKwYBBAGCNxUCBBYEFCqnUv5k
// SIG // xJq+gpE8RjUpzxD/LwTuMB0GA1UdDgQWBBSfpxVdAF5i
// SIG // XYP05dJlpxtTNRnpcjBcBgNVHSAEVTBTMFEGDCsGAQQB
// SIG // gjdMg30BATBBMD8GCCsGAQUFBwIBFjNodHRwOi8vd3d3
// SIG // Lm1pY3Jvc29mdC5jb20vcGtpb3BzL0RvY3MvUmVwb3Np
// SIG // dG9yeS5odG0wEwYDVR0lBAwwCgYIKwYBBQUHAwgwGQYJ
// SIG // KwYBBAGCNxQCBAweCgBTAHUAYgBDAEEwCwYDVR0PBAQD
// SIG // AgGGMA8GA1UdEwEB/wQFMAMBAf8wHwYDVR0jBBgwFoAU
// SIG // 1fZWy4/oolxiaNE9lJBb186aGMQwVgYDVR0fBE8wTTBL
// SIG // oEmgR4ZFaHR0cDovL2NybC5taWNyb3NvZnQuY29tL3Br
// SIG // aS9jcmwvcHJvZHVjdHMvTWljUm9vQ2VyQXV0XzIwMTAt
// SIG // MDYtMjMuY3JsMFoGCCsGAQUFBwEBBE4wTDBKBggrBgEF
// SIG // BQcwAoY+aHR0cDovL3d3dy5taWNyb3NvZnQuY29tL3Br
// SIG // aS9jZXJ0cy9NaWNSb29DZXJBdXRfMjAxMC0wNi0yMy5j
// SIG // cnQwDQYJKoZIhvcNAQELBQADggIBAJ1VffwqreEsH2cB
// SIG // MSRb4Z5yS/ypb+pcFLY+TkdkeLEGk5c9MTO1OdfCcTY/
// SIG // 2mRsfNB1OW27DzHkwo/7bNGhlBgi7ulmZzpTTd2YurYe
// SIG // eNg2LpypglYAA7AFvonoaeC6Ce5732pvvinLbtg/SHUB
// SIG // 2RjebYIM9W0jVOR4U3UkV7ndn/OOPcbzaN9l9qRWqveV
// SIG // tihVJ9AkvUCgvxm2EhIRXT0n4ECWOKz3+SmJw7wXsFSF
// SIG // QrP8DJ6LGYnn8AtqgcKBGUIZUnWKNsIdw2FzLixre24/
// SIG // LAl4FOmRsqlb30mjdAy87JGA0j3mSj5mO0+7hvoyGtmW
// SIG // 9I/2kQH2zsZ0/fZMcm8Qq3UwxTSwethQ/gpY3UA8x1Rt
// SIG // nWN0SCyxTkctwRQEcb9k+SS+c23Kjgm9swFXSVRk2XPX
// SIG // fx5bRAGOWhmRaw2fpCjcZxkoJLo4S5pu+yFUa2pFEUep
// SIG // 8beuyOiJXk+d0tBMdrVXVAmxaQFEfnyhYWxz/gq77EFm
// SIG // PWn9y8FBSX5+k77L+DvktxW/tM4+pTFRhLy/AsGConsX
// SIG // HRWJjXD+57XQKBqJC4822rpM+Zv/Cuk0+CQ1ZyvgDbjm
// SIG // jJnW4SLq8CdCPSWU5nR0W2rRnj7tfqAxM328y+l7vzhw
// SIG // RNGQ8cirOoo6CGJ/2XBjU02N7oJtpQUQwXEGahC0HVUz
// SIG // WLOhcGbyoYICyzCCAjQCAQEwgfihgdCkgc0wgcoxCzAJ
// SIG // BgNVBAYTAlVTMRMwEQYDVQQIEwpXYXNoaW5ndG9uMRAw
// SIG // DgYDVQQHEwdSZWRtb25kMR4wHAYDVQQKExVNaWNyb3Nv
// SIG // ZnQgQ29ycG9yYXRpb24xJTAjBgNVBAsTHE1pY3Jvc29m
// SIG // dCBBbWVyaWNhIE9wZXJhdGlvbnMxJjAkBgNVBAsTHVRo
// SIG // YWxlcyBUU1MgRVNOOkREOEMtRTMzNy0yRkFFMSUwIwYD
// SIG // VQQDExxNaWNyb3NvZnQgVGltZS1TdGFtcCBTZXJ2aWNl
// SIG // oiMKAQEwBwYFKw4DAhoDFQAhABr2F2SSu3FKOtvi7xGE
// SIG // BMe/56CBgzCBgKR+MHwxCzAJBgNVBAYTAlVTMRMwEQYD
// SIG // VQQIEwpXYXNoaW5ndG9uMRAwDgYDVQQHEwdSZWRtb25k
// SIG // MR4wHAYDVQQKExVNaWNyb3NvZnQgQ29ycG9yYXRpb24x
// SIG // JjAkBgNVBAMTHU1pY3Jvc29mdCBUaW1lLVN0YW1wIFBD
// SIG // QSAyMDEwMA0GCSqGSIb3DQEBBQUAAgUA57wr7zAiGA8y
// SIG // MDIzMDMxNTE5MzUxMVoYDzIwMjMwMzE2MTkzNTExWjB0
// SIG // MDoGCisGAQQBhFkKBAExLDAqMAoCBQDnvCvvAgEAMAcC
// SIG // AQACAhjjMAcCAQACAhFAMAoCBQDnvX1vAgEAMDYGCisG
// SIG // AQQBhFkKBAIxKDAmMAwGCisGAQQBhFkKAwKgCjAIAgEA
// SIG // AgMHoSChCjAIAgEAAgMBhqAwDQYJKoZIhvcNAQEFBQAD
// SIG // gYEAhXavzt1ZAkuXj0GEFv3h41DTGxCL4Wq91pVEXBXp
// SIG // Z0CRnzvkFbkie0B+rbqX7eaIDiNi+YEuEt+TR1dtLtkZ
// SIG // ma4lCZr7MtFY3ZwvPMnuGxZ3ujdpyA2ayQrZ43qgA32X
// SIG // xmKWCX35jIaBuzZ+GSFvGtWXAZqrHKvWYxyF2C5DwNox
// SIG // ggQNMIIECQIBATCBkzB8MQswCQYDVQQGEwJVUzETMBEG
// SIG // A1UECBMKV2FzaGluZ3RvbjEQMA4GA1UEBxMHUmVkbW9u
// SIG // ZDEeMBwGA1UEChMVTWljcm9zb2Z0IENvcnBvcmF0aW9u
// SIG // MSYwJAYDVQQDEx1NaWNyb3NvZnQgVGltZS1TdGFtcCBQ
// SIG // Q0EgMjAxMAITMwAAAcUDzc0hofTvOQABAAABxTANBglg
// SIG // hkgBZQMEAgEFAKCCAUowGgYJKoZIhvcNAQkDMQ0GCyqG
// SIG // SIb3DQEJEAEEMC8GCSqGSIb3DQEJBDEiBCB1ch0NVuH9
// SIG // h7JrAQ0aIB1Qrmb6GKMQ72iSYye6SsURtzCB+gYLKoZI
// SIG // hvcNAQkQAi8xgeowgecwgeQwgb0EIBkBsZH2JHdMCvld
// SIG // PcDtLDvrJvIADMo+RLij6rzUP3yxMIGYMIGApH4wfDEL
// SIG // MAkGA1UEBhMCVVMxEzARBgNVBAgTCldhc2hpbmd0b24x
// SIG // EDAOBgNVBAcTB1JlZG1vbmQxHjAcBgNVBAoTFU1pY3Jv
// SIG // c29mdCBDb3Jwb3JhdGlvbjEmMCQGA1UEAxMdTWljcm9z
// SIG // b2Z0IFRpbWUtU3RhbXAgUENBIDIwMTACEzMAAAHFA83N
// SIG // IaH07zkAAQAAAcUwIgQgmPZ3pTQH8qX2PKfHX6/Ak8re
// SIG // VHfZY8NVJ9qLnMdl8D8wDQYJKoZIhvcNAQELBQAEggIA
// SIG // ADYi23N8L79/PdhVJQMA+uG90vHDPDUC3A9VWTKDl4sJ
// SIG // nYzdcX5ax5xeOGYYmBFV+EO3Vxxl95jBgQq/vLpRvHrG
// SIG // PIQLSdkfrFVnXseCBHUnjfSAFOHcLoo/KQ2+27lWrR0l
// SIG // 2R02Nb6qMo/Fl5009xGuEtq2yntUvE/X+/Glsv7UotpA
// SIG // YMs8d5biJIAdWkQhE9fjtrqOSP0pOgL42b9Kwv12ZVyb
// SIG // yVA4JgPDkKtlL1LtDpoQelQlHZxCO34i98wD5WCaiuFh
// SIG // vQzXVVAVYXuBkACFhpxX+ep1qsVTfeJSYDB7GZTT0roZ
// SIG // gIIVx9We85F2UNWKdeU3cTNKECcni00ALHySQH67zOqo
// SIG // RHMY3QeV7s9rcGbPCfDoc1DTt4YX6ecaEOx6qxNjiCTi
// SIG // m6gkM4uo2pMJLN0nZ7dW2aLBwjNZAWfGqnVh7IsFkScy
// SIG // T+t1cEXHvNbzxj4k+qasjTUxsZDol8CGo1uh1w2jOobu
// SIG // cecqr8tMOX/O7gPl3Ugokfo6F/ToIap7Sbbp1S+rfQqh
// SIG // Gdw1GAaH18/vGJT2fwi0+cMJYK3xR4STkLVYUz5yqkU7
// SIG // u9rp3SgV/CLQrSYty21Usovsr+U7NTIPIpjqQnWFIdGu
// SIG // WKO0Z5eWS+7Yv3nNjOAr+EfjpGotcZz3RJyx33oic15T
// SIG // sRvZujD0cdoVHmgaN7IFeiQ=
// SIG // End signature block
