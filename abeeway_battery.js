    /*********************************************************************/
    /***** BATTERY LIFE CALCULATION SCRIPTS                          *****/
    /*********************************************************************/


    /* GLOBAL CONSTANTS */

    const SPREADING_FACTORS = [7, 8, 9, 10, 11, 12]

    const BATTERY_TYPES = {
        primary:      { 
            descr: 'Primary (LTC)',        
            leakage_per_month: 0.003,        // =0.3%
            practical_capacity: 0.80         // =80%
        },                
        rechargeable: { 
            descr: 'Rechargeable (Li-Po)',
            leakage_per_month: 0.05,         // =5%
            practical_capacity: 0.90         // =90%
        },
    };

    const PRODUCTS = {
        industrial: {
            descr: 'Industrial Tracker',
            battery: {
                capacity: 19000,                                                    // [mAh]
                practical_capacity: BATTERY_TYPES.primary.practical_capacity,       // [*100%]
                leakage_per_month: BATTERY_TYPES.primary.leakage_per_month,         // [*100%]
            }
        }, 
        compact: {
            descr: 'Compact Tracker',
            battery: {
                capacity: 8000,                                                     // [mAh]
                practical_capacity: BATTERY_TYPES.primary.practical_capacity,       // [*100%]
                leakage_per_month: BATTERY_TYPES.primary.leakage_per_month,         // [*100%]
            }
        },
        micro: {
            descr: 'Microtracker',
            battery: {
                capacity: 450,                                                      // [mAh]
                practical_capacity: BATTERY_TYPES.rechargeable.practical_capacity,  // [*100%]
                leakage_per_month: BATTERY_TYPES.rechargeable.leakage_per_month,    // [*100%]
            }
        },
        smart_badge: {
            descr: 'Smart Badge',
            battery: {
                capacity: 1300,                                                     // [mAh]
                practical_capacity: BATTERY_TYPES.rechargeable.practical_capacity,  // [*100%]
                leakage_per_month: BATTERY_TYPES.rechargeable.leakage_per_month,    // [*100%]
            }
        },
    }

    const BLE_OPERATIONS = {
        fast_adv:  { descr: 'Fast advertisement (2s)',  time: 2,  current: 10  },   // [s], [mA]
        slow_adv:  { descr: 'Slow advertisement (10s)', time: 10, current: 3.5 },   // [s], [mA]
        connected: { descr: 'Connected (2s)',           time: 2,  current: 3.6 },   // [s], [mA]
        fast_scan: { descr: 'Fast BLE scan (8sec)',     time: 8,  current: 2   },   // [s], [mA]
        slow_scan: { descr: 'Slow BLE scan (30sec)',    time: 30, current: 0.5 },   // [s], [mA]
    };

    const TX_POWERS = { 
        _14dBm_: { descr: '14 dBm', current: 45 },      // SX1262 TX [mA] 
        _17dBm_: { descr: '17 dBm', current: 75 },      // SX1262 TX [mA]
        _19dBm_: { descr: '19 dBm', current: 85 },      // SX1262 TX [mA]
    }

    const SUPPLY_VOLTAGE        = 3.6;     // Supply voltage [V]
    const MCU_CURRENT           = 0.3;     // Current MCU in active mode [mA]
    const RX_CURRENT            = 10;      // Current SX1262 RX [mA]
    const GPS_CURRENT           = 22;      // Current GPS [mA]
    const GPS_STANDBY_CURRENT   = 0.05;    // Current GPS Stand-by [mA]
    const WIFI_CURRENT          = 60;      // Current WiFi [mA]
    const WIFI_ON_TIME          = 3;       // WIFI ON time [s]
    const ACCELEROMETER_CURRENT = 6.5;     // Accelerometer [uA]
    const QUIESENT_CURRENT      = 10;      // [uA]

    const MESSAGE_TYPES = {
        heartbeat: { payl_len: 5  },
        tdoa:      { payl_len: 5  },
        gps:       { payl_len: 17 },
        agps:      { payl_len: 30 },
        wifi:      { payl_len: 33 },
        ble:       { payl_len: 33 },
    }

    const HEARTBEAT_PAYL_LEN = 5;       // [bytes]
    const TDOA_PAYL_LEN      = 5;       // [bytes]
    const GPS_PAYL_LEN       = 17;      // [bytes]
    const AGPS_PAYL_LEN      = 30;      // [bytes]
    const WIFI_PAYL_LEN      = 33;      // [bytes]
    const BLE_PAYL_LEN       = 33;      // [bytes]


    /* CALCULATION FUNCTIONS */

    function calculate_lora_current(sf, tx_power, payl_len, nof_msg_per_day) {

        const SYMBOL_TIME = (2**sf)/125;            // [ms]
        const PREAMBLE_TIME = 12.25 * SYMBOL_TIME;  // [ms]

        let time_on_air;                            // [ms]
        if (sf >= 11) {
            time_on_air = SYMBOL_TIME*(8+Math.ceil(((payl_len+12)*8-4*(sf-7)+16)/(4*sf-8))*5);
        } else {
            time_on_air = SYMBOL_TIME*(8+Math.ceil(((payl_len+12)*8-4*(sf-7)+16)/(4*sf-0))*5);
        }
        let total_time_on_air = time_on_air + PREAMBLE_TIME;

        // all following energy values are in [mJ]
        let tx_energy = total_time_on_air * SUPPLY_VOLTAGE * TX_POWERS[tx_power].current / 1000;
        let rx_energy = 2 * 8*SYMBOL_TIME * SUPPLY_VOLTAGE * RX_CURRENT / 1000;             // 2 RX windows are open after every tx
        let mcu_energy = (total_time_on_air + 2000) * SUPPLY_VOLTAGE * MCU_CURRENT / 1000;  // The MCU cannot sleep until the 2 RX windows are opened
        let total_energy_per_transmission = tx_energy + rx_energy + mcu_energy;

        let average_current = (total_energy_per_transmission / SUPPLY_VOLTAGE) * ( nof_msg_per_day / (24*3600)) // [uA]

        return average_current * 1000; // in [uA]

    }

    function calculate_gps_current(gps_ttff, gps_conv_time, nof_msg_per_day) {

        let gps_usage_time_of_cold_start = Math.min(gps_ttff + gps_conv_time, 300);

        let average_current_with_cold_starts_only = gps_usage_time_of_cold_start * GPS_CURRENT * nof_msg_per_day / (24 *3600);

        let average_current_with_hot_starts = (                                  // we assume that there is only one cold start per day 
            gps_usage_time_of_cold_start * GPS_CURRENT +                         // 1st time there is a cold start
            (nof_msg_per_day - 1) * gps_conv_time * GPS_CURRENT +                // all the rest of the gps updates are with hot start
            (24 * 3600 - gps_conv_time * nof_msg_per_day) * GPS_STANDBY_CURRENT  // the gps board is in standby status in between
        ) / (24 * 3600)

        let  average_current = Math.min(average_current_with_cold_starts_only, average_current_with_hot_starts);

        return average_current * 1000;  // in [uA]

    }

    function calculate_agps_current(agps_on_time, nof_msg_per_day) {
        let average_current = agps_on_time * GPS_CURRENT * nof_msg_per_day / (24*3600);
        return average_current * 1000;  // in [uA]
    }

    function calculate_wifi_current(nof_msg_per_day) {
        let average_current = WIFI_ON_TIME * WIFI_CURRENT * nof_msg_per_day / (24*3600);
        return average_current * 1000;  // in [uA]
    }

    function calculate_ble_current(operation, nof_msg_per_day) {
        let average_current = BLE_OPERATIONS[operation].time * BLE_OPERATIONS[operation].current * nof_msg_per_day / (24*3600);
        return average_current * 1000;  // in [uA]
    }

    function calculate_advanced_ble_usage_current(operation, usage_time_per_day) {
        let average_current = BLE_OPERATIONS[operation].current * usage_time_per_day / ( 24 );
        return average_current * 1000;  // in [uA]
    }

    function calculate_battery_life_time(input) {

        let i_custom_lora    = calculate_lora_current(input.sf, input.tx_power, input.custom.payl_len, input.custom.nof_msg_per_day);
        let i_heartbeat_lora = calculate_lora_current(input.sf, input.tx_power, HEARTBEAT_PAYL_LEN, input.heartbeat.nof_msg_per_day);
        // TODO: TO HAVE IT VERIFIED BY STEPHANE B, (N times repeated packets open 2*N RX receive windows...)
        // It was not like that in the original excel table!!!
        let i_tdoa_lora      = calculate_lora_current(input.sf, input.tx_power, TDOA_PAYL_LEN, input.tdoa.nof_msg_per_day) * input.tdoa.nof_msg_repetition;
        let i_gps_lora       = calculate_lora_current(input.sf, input.tx_power, GPS_PAYL_LEN, input.gps.nof_msg_per_day);
        let i_agps_lora      = calculate_lora_current(input.sf, input.tx_power, AGPS_PAYL_LEN, input.agps.nof_msg_per_day);
        let i_wifi_lora      = calculate_lora_current(input.sf, input.tx_power, WIFI_PAYL_LEN, input.wifi.nof_msg_per_day);
        let i_ble_lora       = calculate_lora_current(input.sf, input.tx_power, BLE_PAYL_LEN, input.ble.nof_msg_per_day);
            
        let i_gps_geoloc     = calculate_gps_current(input.gps.ttff, input.gps.conv_time, input.gps.nof_msg_per_day);
        let i_agps_geoloc    = calculate_agps_current(input.agps.on_time, input.agps.nof_msg_per_day);
        let i_wifi_geoloc    = calculate_wifi_current(input.wifi.nof_msg_per_day);
        let i_ble_geoloc     = calculate_ble_current(input.ble.operation, input.ble.nof_msg_per_day);
        
        let i_advanced_ble_usage  = calculate_advanced_ble_usage_current(input.advanced_ble.operation, input.advanced_ble.usage_time_per_day);
 
        let total_average_current = (
            i_custom_lora + i_heartbeat_lora + i_tdoa_lora + i_gps_lora + i_agps_lora + i_wifi_lora + i_ble_lora +
            i_ble_geoloc + i_gps_geoloc + i_agps_geoloc + i_wifi_geoloc +
            i_advanced_ble_usage +
            QUIESENT_CURRENT +
            (input.accelerometer_on ? ACCELEROMETER_CURRENT : 0)
        ) / 1000      // [mA]

        const battery_capacity = PRODUCTS[input.product].battery.capacity;                             // [mAh]
        const practical_capacity = PRODUCTS[input.product].battery.practical_capacity;                 // [100%]
        const battery_leakage_per_month = PRODUCTS[input.product].battery.leakage_per_month;           // [100%]

        let average_battery_leakage = (battery_capacity / 2) * ( battery_leakage_per_month /(30*24) )  // [mA]

        let battery_life_time = ( battery_capacity / (total_average_current + average_battery_leakage) ) / 24;

        return battery_life_time * practical_capacity;
    };


    // TESTING THE ABOVE CODE WITH SAMPLE DATA

    let input = {

        product: 'micro',                       // industrial|compact|micro|smart_badge
        tx_power: '_14dBm_',                    // _14dBm_|_17dBm_|_19dBm
        sf: 10,                                 // 7|8|9|10|11|12
        accelerometer_on: true,
        // TODO: transmission strategy and packet repetition NOT IMPLEMENTED!!!
    
        custom: {
            nof_msg_per_day: 0,
            payl_len: 17,                       // [bytes]
        },
        heartbeat: {
            nof_msg_per_day: 24,
        },
        tdoa: {
            nof_msg_per_day: 24,
            nof_msg_repetition: 4,
        },
        gps: {
            nof_msg_per_day: 24,
            ttff: 49,                           // [s]
            conv_time: 90,                      // [s]
        },
        agps: {
            nof_msg_per_day: 24,
            on_time: 8,                         // [s]
            nof_satellites: 5, 
            // TODO: nof_satellites NOT IMPLEMENTED!!!
        },
        wifi: {
            nof_msg_per_day: 24,
            nof_bssid: 4, 
            // TODO: nof_bssid NOT IMPLEMENTED!!!
        },
        ble: {
            nof_msg_per_day: 24,
            nof_bssid: 4, 
            // TODO: nof_bssid NOT IMPLEMENTED!!!
            operation: 'fast_scan',             // fast_scan|slow_scan 
        },
        advanced_ble: {
            usage_time_per_day: 0,
            operation: 'fast_adv',              // fast_adv|slow_adv|connected|fast_scan|slow_scan

            // fast_scan_usage_time_per_day: 0,
            // slow_scan_usage_time_per_day: 0,     
            // fast_adv_usage_time_per_day:  0,
            // slow_adv_usage_time_per_day:  0,
            // connected_usage_time_per_day: 0,

        }
    };

    console.log(
        'Estimated Battery Life Time:',
        calculate_battery_life_time(input).toFixed(2),
        'days'
    );
