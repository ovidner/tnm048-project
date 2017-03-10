//
//  main.swift
//  tnm048-project
//
//  Created by Olle Vidner on 2017-03-05.
//  Copyright (c) 2017 Olle Vidner. All rights reserved.
//

import Dispatch
import Foundation

let apiBaseUrl = "http://opendata-download-metobs.smhi.se/api/version/latest/"
let wantedParameters: [String] = [
        "2", // Lufttemperatur, medelvärde 1 dygn, 1 gång/dygn, kl 00
        "5"  // Nederbördsmängd, summa 1 dygn, 1 gång/dygn, kl 06
]
var wantedParameterStationPairs: [(String, String)] = []
let cwd = FileManager.default.currentDirectoryPath

func makeRequest(url: String, completionHandler: @escaping (Data?) -> Void) {
    let url = URL(string: url)

    let task = URLSession.shared.dataTask(with: url!) { data, response, error in
        guard error == nil else {
            print(error!)
            return
        }
        guard let data = data else {
            print("data is empty")
            return
        }

        completionHandler(data)
    }

    task.resume()
}

func getStationDataPath(parameter: String, station: String) -> String {
    return "\(cwd)/data/raw/smhi/\(parameter)/\(station).csv"
}

func buildParameterUrl(parameter: String) -> String {
    return "\(apiBaseUrl)parameter/\(parameter).json"
}

func buildDataUrl(parameter: String, station: String) -> String {
    return "\(apiBaseUrl)parameter/\(parameter)/station/\(station)/period/corrected-archive/data.csv"
}

for parameter in wantedParameters {
    var parameterSema = DispatchSemaphore(value: 0)

    makeRequest(url: buildParameterUrl(parameter: parameter)) { data in
        let json = try! JSONSerialization.jsonObject(with: data!, options: [])
        let stationsJson = ((json as? [String: Any])?["station"] as? [Any])!
        for i in stationsJson {
            let station = (i as? [String: Any])?["key"] as! String

            if !FileManager.default.fileExists(atPath: getStationDataPath(parameter: parameter, station: station)) {
                wantedParameterStationPairs.append((parameter, station))
            }
        }
        parameterSema.signal()
    }

    parameterSema.wait()
}

for pair in wantedParameterStationPairs {
    let stationSema = DispatchSemaphore(value: 0)

    makeRequest(url: buildDataUrl(parameter: pair.0, station: pair.1)) { data in
        try! data!.write(to: URL(string: "file://\(getStationDataPath(parameter: pair.0, station: pair.1))")!)
        stationSema.signal()
    }

    stationSema.wait()
}