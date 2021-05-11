/*
  Sliver Implant Framework
  Copyright (C) 2021  Bishop Fox
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

import { Component, OnInit, Inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { take } from 'rxjs/operators';
import * as clientpb from 'sliver-script/lib/pb/clientpb/client_pb';


import { FadeInOut } from '@app/shared/animations';
import { JobsService } from '@app/providers/jobs.service';


@Component({
  selector: 'jobs-job',
  templateUrl: './job.component.html',
  styleUrls: ['./job.component.scss'],
  animations: [FadeInOut]
})
export class JobComponent implements OnInit {

  job: clientpb.Job;

  constructor(public dialog: MatDialog,
              private _route: ActivatedRoute,
              private _router: Router,
              private _jobsService: JobsService) { }

  ngOnInit() {
    this._route.params.pipe(take(1)).subscribe((params) => {
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

  stopJob() {
    const dialogRef = this.dialog.open(StopJobDialogComponent, {
      data: {
        job: this.job
      },
    });
    dialogRef.afterClosed().pipe(take(1)).subscribe(async (job) => {
      if (job) {
        const killed = await this._jobsService.killJob(job.getId());
        if (killed.getSuccess()) {
          this._router.navigate(['jobs']);
        } else {
          alert(`Failed to kill job`);
        }
      }
    });
  }

  back() {
    window.history.back();
  }

}


@Component({
  selector: 'jobs-stop-job-dialog',
  templateUrl: 'stop-job.dialog.html',
})
export class StopJobDialogComponent {

  constructor(public dialogRef: MatDialogRef<StopJobDialogComponent>,
              @Inject(MAT_DIALOG_DATA) public data: any) { }

  onNoClick(): void {
    this.dialogRef.close();
  }

}
