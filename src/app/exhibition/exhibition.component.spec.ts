import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExhibitionComponent } from './exhibition.component';

describe('ExhibitionComponent', () => {
  let component: ExhibitionComponent;
  let fixture: ComponentFixture<ExhibitionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExhibitionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExhibitionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
