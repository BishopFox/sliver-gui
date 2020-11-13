/*
  Sliver Implant Framework
  Copyright (C) 2019  Bishop Fox
  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.
  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU General Public License for more details.
  You should have received a copy of the GNU General Public License
  along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { FadeInOut } from '@app/shared/animations';
import { JobsService } from '@app/providers/jobs.service';
import * as clientpb from 'sliver-script/lib/pb/clientpb/client_pb'; // Protobuf


@Component({
  selector: 'jobs-job',
  templateUrl: './job.component.html',
  styleUrls: ['./job.component.scss'],
  animations: [FadeInOut]
})
export class JobComponent implements OnInit {

  job: clientpb.Job;

  constructor(private _route: ActivatedRoute,
              private _jobsService: JobsService) { }

  ngOnInit() {
    this._route.params.subscribe((params) => {
      const jobId: number = parseInt(params['job-id'], 10);
      console.log(`Job ${jobId}`);
      this._jobsService.jobById(jobId).then((job) => {
        console.log(job);
        this.job = job;
      }).catch(() => {
        console.log(`No job with id ${jobId}`);
      });
    });
  }

  back() {
    window.history.back();
  }

}
