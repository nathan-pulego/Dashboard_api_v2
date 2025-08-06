import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {DashboardDbDataSource} from '../datasources';
import {Task, TaskRelations} from '../models';

export class TaskRepository extends DefaultCrudRepository<
  Task,
  typeof Task.prototype.id,
  TaskRelations
> {
  constructor(
    @inject('datasources.dashboard_db') dataSource: DashboardDbDataSource,
  ) {
    super(Task, dataSource);
  }
}