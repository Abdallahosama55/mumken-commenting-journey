import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { createDraftStore, type DraftStore } from '../data/draft-store';
import { createInMemoryRepository, type InMemoryRepository, type InMemoryRepositoryOptions } from '../data/in-memory-repository';
import { createNetworkSimulator, type NetworkSimulator, type SimulationSettings } from '../data/network-simulator';
import type { Locale } from '../domain/types';
import { CommentingProvider, I18nProvider, type CommentingServices } from '../react/providers';

export interface TestServices extends CommentingServices {
  readonly repository: InMemoryRepository;
  readonly drafts: DraftStore;
  readonly network: NetworkSimulator;
  readonly queryClient: QueryClient;
}

/**
 * Deterministic services for tests: zero latency, fixed clock, no retries.
 * Shared by the core, web and mobile suites so all three exercise the same data layer.
 */
export function createTestServices(
  options: { simulation?: Partial<SimulationSettings> } & Omit<InMemoryRepositoryOptions, 'network'> = {},
): TestServices {
  const { simulation, ...repositoryOptions } = options;
  const network = createNetworkSimulator({ defaults: { latency: 'instant' }, initial: simulation });
  const repository = createInMemoryRepository({
    now: () => new Date('2026-10-30T12:00:00Z'),
    ...repositoryOptions,
    network,
  });
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false } },
  });
  return { repository, network, drafts: createDraftStore(), queryClient };
}

export function TestProviders({
  services,
  locale = 'en',
  children,
}: {
  services: TestServices;
  locale?: Locale;
  children: ReactNode;
}) {
  return (
    <QueryClientProvider client={services.queryClient}>
      <CommentingProvider services={services}>
        <I18nProvider locale={locale}>{children}</I18nProvider>
      </CommentingProvider>
    </QueryClientProvider>
  );
}
