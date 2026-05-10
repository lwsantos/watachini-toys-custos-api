-- Baseline: use quando o banco JÁ está no schema atual até CreateOrderItemsTable,
-- mas a tabela public.migrations estava vazia (ex.: schema criado com synchronize).
-- Rode este SQL UMA VEZ, depois: npm run migration:run
--
-- Ajuste se a coluna "timestamp" na sua tabela migrations tiver outro nome (TypeORM padrão: timestamp + name).

INSERT INTO migrations (timestamp, name)
SELECT v.ts, v.n
FROM (
  VALUES
    (1700000000000::bigint, 'InitialSchema1700000000000'),
    (1700000000001::bigint, 'RemoveFilamentPurchaseIdUniqueConstraint1700000000001'),
    (1700000000002::bigint, 'AddLaborTimeMinutesToProduct1700000000002'),
    (1700000000003::bigint, 'AddFilamentCostSnapshotToProductPart1700000000003'),
    (1700000000004::bigint, 'RemoveLaborCostFromProductPart1700000000004'),
    (1700000000005::bigint, 'UpdateEnergyCostConfiguration1700000000005'),
    (1700000000006::bigint, 'AlterPartFilamentsToCharacteristics1700000000006'),
    (1700000000007::bigint, 'ReduceCostPerGramPrecision1700000000007'),
    (1700000000009::bigint, 'RemovePurchaseLocationFromFilament1700000000009'),
    (1700000000010::bigint, 'CreateCustomersTable1700000000010'),
    (1700000000011::bigint, 'CreateOrdersTable1700000000011'),
    (1700000000012::bigint, 'CreateOrderItemsTable1700000000012')
) AS v(ts, n)
WHERE NOT EXISTS (
  SELECT 1 FROM migrations m WHERE m.timestamp = v.ts AND m.name = v.n
);
