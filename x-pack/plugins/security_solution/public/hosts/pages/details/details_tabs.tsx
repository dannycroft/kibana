/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useCallback, useMemo } from 'react';
import { Switch } from 'react-router-dom';
import { Route } from '@kbn/kibana-react-plugin/public';

import type { UpdateDateRange } from '../../../common/components/charts/common';
import { scoreIntervalToDateTime } from '../../../common/components/ml/score/score_interval_to_datetime';
import type { Anomaly } from '../../../common/components/ml/types';
import { HostsTableType } from '../../store/model';
import { AnomaliesQueryTabBody } from '../../../common/containers/anomalies/anomalies_query_tab_body';
import { useGlobalTime } from '../../../common/containers/use_global_time';
import { AnomaliesHostTable } from '../../../common/components/ml/tables/anomalies_host_table';
import { EventsQueryTabBody } from '../../../common/components/events_tab';
import { hostNameExistsFilter } from '../../../common/components/visualization_actions/utils';

import type { HostDetailsTabsProps } from './types';
import { type } from './utils';

import {
  HostsQueryTabBody,
  AuthenticationsQueryTabBody,
  UncommonProcessQueryTabBody,
  HostRiskTabBody,
  SessionsTabBody,
} from '../navigation';
import { TimelineId } from '../../../../common/types';

export const HostDetailsTabs = React.memo<HostDetailsTabsProps>(
  ({
    detailName,
    filterQuery,
    indexNames,
    indexPattern,
    pageFilters = [],
    setAbsoluteRangeDatePicker,
    hostDetailsPagePath,
  }) => {
    const { from, to, isInitializing, deleteQuery, setQuery } = useGlobalTime();
    const narrowDateRange = useCallback(
      (score: Anomaly, interval: string) => {
        const fromTo = scoreIntervalToDateTime(score, interval);
        setAbsoluteRangeDatePicker({
          id: 'global',
          from: fromTo.from,
          to: fromTo.to,
        });
      },
      [setAbsoluteRangeDatePicker]
    );

    const updateDateRange = useCallback<UpdateDateRange>(
      ({ x }) => {
        if (!x) {
          return;
        }
        const [min, max] = x;
        setAbsoluteRangeDatePicker({
          id: 'global',
          from: new Date(min).toISOString(),
          to: new Date(max).toISOString(),
        });
      },
      [setAbsoluteRangeDatePicker]
    );

    const tabProps = {
      deleteQuery,
      endDate: to,
      filterQuery,
      skip: isInitializing || filterQuery === undefined,
      setQuery,
      startDate: from,
      type,
      indexPattern,
      indexNames,
      hostName: detailName,
      narrowDateRange,
      updateDateRange,
    };

    const externalAlertPageFilters = useMemo(
      () => [...hostNameExistsFilter, ...pageFilters],
      [pageFilters]
    );

    return (
      <Switch>
        <Route path={`${hostDetailsPagePath}/:tabName(${HostsTableType.authentications})`}>
          <AuthenticationsQueryTabBody {...tabProps} />
        </Route>
        <Route path={`${hostDetailsPagePath}/:tabName(${HostsTableType.hosts})`}>
          <HostsQueryTabBody {...tabProps} />
        </Route>
        <Route path={`${hostDetailsPagePath}/:tabName(${HostsTableType.uncommonProcesses})`}>
          <UncommonProcessQueryTabBody {...tabProps} />
        </Route>
        <Route path={`${hostDetailsPagePath}/:tabName(${HostsTableType.anomalies})`}>
          <AnomaliesQueryTabBody {...tabProps} AnomaliesTableComponent={AnomaliesHostTable} />
        </Route>

        <Route path={`${hostDetailsPagePath}/:tabName(${HostsTableType.events})`}>
          <EventsQueryTabBody
            {...tabProps}
            pageFilters={pageFilters}
            timelineId={TimelineId.hostsPageEvents}
            externalAlertPageFilters={externalAlertPageFilters}
          />
        </Route>
        <Route path={`${hostDetailsPagePath}/:tabName(${HostsTableType.risk})`}>
          <HostRiskTabBody {...tabProps} />
        </Route>
        <Route path={`${hostDetailsPagePath}/:tabName(${HostsTableType.sessions})`}>
          <SessionsTabBody {...tabProps} />
        </Route>
      </Switch>
    );
  }
);

HostDetailsTabs.displayName = 'HostDetailsTabs';
