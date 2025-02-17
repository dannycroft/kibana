/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { RulesClient } from '@kbn/alerting-plugin/server';
import type { BulkActionEditPayload } from '../../../../common/detection_engine/schemas/common';
import { enrichFilterWithRuleTypeMapping } from './enrich_filter_with_rule_type_mappings';
import type { MlAuthz } from '../../machine_learning/authz';

import { ruleParamsModifier } from './bulk_actions/rule_params_modifier';
import { splitBulkEditActions } from './bulk_actions/split_bulk_edit_actions';
import { validateBulkEditRule } from './bulk_actions/validations';
import { bulkEditActionToRulesClientOperation } from './bulk_actions/action_to_rules_client_operation';

import type { RuleAlertType } from './types';

export interface BulkEditRulesArguments {
  rulesClient: RulesClient;
  actions: BulkActionEditPayload[];
  filter?: string;
  ids?: string[];
  mlAuthz: MlAuthz;
}

/**
 * calls rulesClient.bulkEdit
 * transforms bulk actions payload into rulesClient compatible operations
 * enriches query filter with rule types search queries
 * @param BulkEditRulesArguments
 * @returns edited rules and caught errors
 */
export const bulkEditRules = ({
  rulesClient,
  ids,
  actions,
  filter,
  mlAuthz,
}: BulkEditRulesArguments) => {
  const { attributesActions, paramsActions } = splitBulkEditActions(actions);

  return rulesClient.bulkEdit({
    ...(ids ? { ids } : { filter: enrichFilterWithRuleTypeMapping(filter) }),
    operations: attributesActions.map(bulkEditActionToRulesClientOperation),
    paramsModifier: async (ruleParams: RuleAlertType['params']) => {
      await validateBulkEditRule({ mlAuthz, ruleType: ruleParams.type });
      return ruleParamsModifier(ruleParams, paramsActions);
    },
  });
};
