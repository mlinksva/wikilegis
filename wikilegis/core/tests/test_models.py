from autofixture import AutoFixture
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from django.test import TestCase
from django.utils.text import slugify
from django.utils.translation import ugettext as _
from core import models


class ModelsTestCase(TestCase):

    def setUp(self):
        self.theme_fixture = AutoFixture(models.BillTheme)
        self.bill_fixture = AutoFixture(models.Bill, generate_fk=True)
        self.segment_fixture = AutoFixture(models.BillSegment)

    def test_bill_theme_str(self):
        theme = self.theme_fixture.create_one()
        theme.description = 'Theme Description'
        theme.save()
        self.assertEquals(theme.__str__(), 'theme-description')

    def test_comment_str(self):
        self.theme_fixture.create_one()
        ctype = ContentType.objects.get_for_model(models.Bill)
        bill = self.bill_fixture.create_one()
        comment_fixture = AutoFixture(models.Comment, field_values={
            'author': AutoFixture(get_user_model()).create_one(),
            'content_type': ctype,
            'object_id': bill.id
        })
        comment = comment_fixture.create_one()
        comment.text = 'test comment'
        comment.save()
        self.assertEquals(comment.__str__(), 'test comment')

    def test_bill_str(self):
        self.theme_fixture.create_one()
        bill = self.bill_fixture.create_one()
        bill.title = 'test bill'
        bill.save()
        self.assertEquals(bill.__str__(), 'test bill')

    def test_bill_get_absolute_url(self):
        self.theme_fixture.create_one()
        bill = self.bill_fixture.create_one()
        bill.title = 'test bill'
        bill.save()
        self.assertEquals(bill.get_absolute_url(), '/bill/%d' % bill.id)

    def test_bill_save(self):
        self.theme_fixture.create_one()
        bill = self.bill_fixture.create_one()
        bill.is_visible = None
        bill.save()
        self.assertEquals(bill.is_visible, True)

    def test_bill_video_str(self):
        self.theme_fixture.create_one()
        self.bill_fixture.create_one()
        fixture = AutoFixture(models.BillVideo)
        video = fixture.create_one()
        video.url = 'http://test.url/'
        self.assertEquals(video.__str__(), 'http://test.url/')

    def test_bill_reference_str(self):
        self.theme_fixture.create_one()
        self.bill_fixture.create_one()
        fixture = AutoFixture(models.BillReference,
                              field_values={'title': 'test title'})
        reference = fixture.create_one()
        self.assertEquals(reference.__str__(), 'test title')

    def test_segment_str_with_number_and_segment_type(self):
        self.theme_fixture.create_one()
        self.bill_fixture.create_one()
        segment_type = AutoFixture(models.SegmentType, field_values={
            'presentation_name': 'artigo'}).create_one()
        segment = self.segment_fixture.create_one()
        segment.number = '1'
        segment.segment_type = segment_type
        segment.save()
        self.assertEquals(segment.__str__(), 'artigo 1')

    def test_segment_str_without_number_and_segment_type(self):
        self.theme_fixture.create_one()
        self.bill_fixture.create_one()
        segment = self.segment_fixture.create_one()
        segment.save()
        self.assertEquals(segment.__str__(), _('segment'))

    def test_segment_save(self):
        self.theme_fixture.create_one()
        self.bill_fixture.create_one()
        segment = self.segment_fixture.create_one()
        segment.additive_amendments_count = None
        segment.modifier_amendments_count = None
        segment.supress_amendments_count = None
        segment.save()
        self.assertEquals(segment.additive_amendments_count, 0)
        self.assertEquals(segment.modifier_amendments_count, 0)
        self.assertEquals(segment.supress_amendments_count, 0)

    def test_segment_type_str(self):
        fixture = AutoFixture(models.SegmentType)
        segment_type = fixture.create_one()
        segment_type.save()
        self.assertEquals(segment_type.__str__(), slugify(segment_type.name))

    def test_updown_vote_str(self):
        user = AutoFixture(get_user_model(), field_values={
            'first_name': 'first',
            'last_name': 'last',
            'email': 'email@test.com'
        }).create_one()
        vote = AutoFixture(models.UpDownVote).create_one()
        vote.user = user
        vote.save()
        self.assertEquals(vote.__str__(), 'first last')

    def test_modifier_amendment_bill_is_closed(self):
        bill = AutoFixture(models.Bill, field_values={
            'status': 'closed'
        }, generate_fk=True).create_one()
        segment = AutoFixture(models.BillSegment, field_values={
            'bill': bill
        }, generate_fk=True).create_one()
        amendment = AutoFixture(models.ModifierAmendment, field_values={
            'replaced': segment
        }, generate_fk=True).create_one()
        self.assertTrue(amendment.bill_is_closed())

    def test_supress_amendment_bill_is_closed(self):
        bill = AutoFixture(models.Bill, field_values={
            'status': 'closed'
        }, generate_fk=True).create_one()
        segment = AutoFixture(models.BillSegment, field_values={
            'bill': bill
        }, generate_fk=True).create_one()
        amendment = AutoFixture(models.SupressAmendment, field_values={
            'supressed': segment
        }, generate_fk=True).create_one()
        self.assertTrue(amendment.bill_is_closed())

    def test_additive_amendment_bill_is_closed(self):
        bill = AutoFixture(models.Bill, field_values={
            'status': 'closed'
        }, generate_fk=True).create_one()
        segment = AutoFixture(models.BillSegment, field_values={
            'bill': bill
        }, generate_fk=True).create_one()
        amendment = AutoFixture(models.AdditiveAmendment, field_values={
            'reference': segment
        }, generate_fk=True).create_one()
        self.assertTrue(amendment.bill_is_closed())
