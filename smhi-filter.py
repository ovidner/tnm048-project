# -*- coding: utf-8 -*-
from datetime import date, datetime
from os import walk

import fiona
import numpy as np
import tablib
from scipy import interpolate
from shapely.geometry import asShape
from shapely.ops import unary_union

DATETIME_FORMAT = '%Y-%m-%d %H:%M:%S'

PARAMETERS = {
    '2': {
        'input_name': 'Lufttemperatur',
        'output_name': 'temperature',
    },
    '5': {
        'input_name': 'Nederbördsmängd',
        'output_name': 'precipitation',
    }
}

DATES = [
    date(1973, 9, 16),
    date(1976, 9, 19),
    date(1979, 9, 16),
    date(1982, 9, 19),
    date(1985, 9, 15),
    date(1988, 9, 18),
    date(1991, 9, 15),
    date(1994, 9, 18),
    date(1998, 9, 20),
    date(2002, 9, 15),
    date(2006, 9, 17),
    date(2010, 9, 19),
    date(2014, 9, 14)
]

municipalities = dict([
    (record['properties']['KnKod'], asShape(record['geometry']))
    for record in fiona.open('public/data/municipalities-wgs84.geojson')
])

country = unary_union(municipalities.values())

municipality_centroids = dict([
    (key, record.centroid)
    for key, record in municipalities.items()
])

print('--- Parsing observations... ---')
observations = {}
for p_id, p_data in PARAMETERS.items():
    observations[p_data['output_name']] = {}
    for (path, _, file_names) in walk(f'public/data/raw/smhi/{p_id}'):
        for file_name in file_names:
            if file_name[-4:] == '.csv':
                print('Parsing', f'{path}/{file_name}')
                date_position = dict()
                with open(f'{path}/{file_name}') as f:
                    # Skip unwanted rows
                    for row in f:
                        if row == 'Tidsperiod (fr.o.m);Tidsperiod (t.o.m);Höjd (meter över havet);Latitud (decimalgrader);Longitud (decimalgrader)\n':
                            break

                    # Position rows
                    for row in f:
                        if row == '\n':
                            break
                        start, end, altitude, latitude, longitude = (
                            row.rstrip('\n').split(';'))
                        start_date = datetime.strptime(
                            start, DATETIME_FORMAT).date()
                        end_date = datetime.strptime(
                            end, DATETIME_FORMAT).date()

                        for date in DATES:
                            if start_date <= date <= end_date:
                                date_position[date.isoformat()] = dict(
                                    latitude=latitude,
                                    longitude=longitude,
                                    altitude=altitude
                                )
                                observations[p_data['output_name']].setdefault(
                                    date.isoformat(),
                                    np.empty([0, 4], dtype=np.float64))

                    # Skip the header row
                    f.readline()

                    # Data rows
                    for row in f:
                        _, _, repr_date, value, quality, *_ = row.rstrip(
                            '\n').split(';')

                        if repr_date not in date_position.keys():
                            continue

                        observations[p_data['output_name']][repr_date] = np.append(
                            observations[p_data['output_name']][repr_date],
                            np.array([[
                                date_position[repr_date]['longitude'],
                                date_position[repr_date]['latitude'],
                                date_position[repr_date]['altitude'],
                                value
                            ]], dtype=np.float64),
                            axis=0
                        )

print('--- Building models... ---')
models = {}
for p_id, p_data in PARAMETERS.items():
    # Build interpolated model
    models[p_data['output_name']] = {}

    for model_date in observations[p_data['output_name']].keys():
        models[p_data['output_name']][
            model_date] = interpolate.LinearNDInterpolator(
            observations[p_data['output_name']][model_date][:, 0:2],
            observations[p_data['output_name']][model_date][:, 3]
        )


print('--- Applying models and writing data... ---')
for p_id, p_data in PARAMETERS.items():
    output_data = tablib.Dataset()
    output_data.headers = ('year', 'municipality', 'value')

    for mun_code, mun_cent in municipality_centroids.items():
        for model_date in observations[p_data['output_name']].keys():
            output_data.append((
                model_date[0:4],
                mun_code,
                models[p_data['output_name']][model_date](*np.array(mun_cent))
            ))

    with open(f'public/data/{p_data["output_name"]}.csv', 'w') as f:
        print('Writing', f.name)
        f.write(output_data.sort('municipality').sort('year').csv)
